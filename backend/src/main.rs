mod auth;
mod error;
mod models;
mod routes;
mod services;
mod state;

use std::env;
use std::net::SocketAddr;

use axum::middleware;
use axum::routing::{get, post};
use axum::Router;
use oauth2::basic::BasicClient;
use oauth2::{AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl};
use sqlx::postgres::PgPoolOptions;
use tower_http::services::{ServeDir, ServeFile};
use tower_sessions::cookie::SameSite;
use tower_sessions::{Expiry, SessionManagerLayer};
use tower_sessions_sqlx_store::PostgresStore;

use crate::services::embedding::EmbeddingService;
use crate::state::AppState;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt::init();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    // Run migrations
    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("Failed to run migrations");
    tracing::info!("Migrations applied successfully");

    // Session store
    let session_store = PostgresStore::new(pool.clone());
    session_store
        .migrate()
        .await
        .expect("Failed to create session table");

    let session_layer = SessionManagerLayer::new(session_store)
        .with_secure(false)
        .with_same_site(SameSite::Lax)
        .with_expiry(Expiry::OnInactivity(tower_sessions::cookie::time::Duration::days(30)));

    // Embedding service
    let openai_key = env::var("OPENAI_API_KEY").expect("OPENAI_API_KEY must be set");
    let embedding = EmbeddingService::new(openai_key);

    // OAuth client
    let google_client_id =
        ClientId::new(env::var("GOOGLE_CLIENT_ID").expect("GOOGLE_CLIENT_ID must be set"));
    let google_client_secret = ClientSecret::new(
        env::var("GOOGLE_CLIENT_SECRET").expect("GOOGLE_CLIENT_SECRET must be set"),
    );
    let auth_url =
        AuthUrl::new("https://accounts.google.com/o/oauth2/v2/auth".to_string()).unwrap();
    let token_url =
        TokenUrl::new("https://oauth2.googleapis.com/token".to_string()).unwrap();

    let redirect_url = env::var("OAUTH_REDIRECT_URL")
        .unwrap_or_else(|_| "http://localhost:8080/api/auth/callback".to_string());

    let oauth_client = BasicClient::new(google_client_id)
        .set_client_secret(google_client_secret)
        .set_auth_uri(auth_url)
        .set_token_uri(token_url)
        .set_redirect_uri(RedirectUrl::new(redirect_url).unwrap());

    // Allowed emails
    let allowed_emails: Vec<String> = env::var("ALLOWED_EMAILS")
        .unwrap_or_default()
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    let state = AppState::new(pool, embedding, oauth_client, allowed_emails);

    let static_dir = env::var("STATIC_DIR").unwrap_or_else(|_| "../frontend/dist".to_string());
    let index_file = format!("{static_dir}/index.html");

    // Auth routes (nested under /api/auth)
    let auth_routes = Router::new()
        .route("/google", get(auth::google_login))
        .route("/callback", get(auth::google_callback))
        .route("/logout", post(auth::logout))
        .route("/me", get(auth::me))
        .with_state(state.clone());

    let api = Router::new()
        .nest("/auth", auth_routes)
        .merge(routes::api_router(state))
        .layer(middleware::from_fn(auth::middleware::require_auth));

    let app = Router::new()
        .nest("/api", api)
        .fallback_service(ServeDir::new(&static_dir).fallback(ServeFile::new(index_file)))
        .layer(session_layer);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
