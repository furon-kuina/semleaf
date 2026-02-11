#![allow(dead_code)]

use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

use axum::body::Body;
use axum::http::{self, Request, StatusCode};
use axum::middleware;
use axum::routing::{get, post};
use axum::Router;
use http_body_util::BodyExt;
use oauth2::basic::BasicClient;
use oauth2::{AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl};
use pgvector::Vector;
use semleaf_backend::auth;
use semleaf_backend::error::AppError;
use semleaf_backend::routes;
use semleaf_backend::services::embedding::Embedder;
use semleaf_backend::state::AppState;
use sqlx::PgPool;
use tower::ServiceExt;
use tower_sessions::cookie::SameSite;
use tower_sessions::{Expiry, MemoryStore, SessionManagerLayer};

/// Fake embedder that returns zero vectors of dimension 3072.
pub struct FakeEmbedder;

impl Embedder for FakeEmbedder {
    fn embed<'a>(
        &'a self,
        _text: &'a str,
    ) -> Pin<Box<dyn Future<Output = Result<Vector, AppError>> + Send + 'a>> {
        Box::pin(async { Ok(Vector::from(vec![0.0_f32; 3072])) })
    }
}

/// Creates a unique test database, runs migrations, returns the pool.
pub async fn setup_test_db() -> (PgPool, String) {
    // Load .env from the project root
    dotenvy::from_path(std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../.env")).ok();

    let base_url =
        std::env::var("TEST_DATABASE_URL").unwrap_or_else(|_| {
            std::env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/postgres".to_string())
        });

    let db_name = format!("semleaf_test_{}", uuid::Uuid::new_v4().to_string().replace('-', ""));

    // Connect to base database to create test database
    let admin_pool = PgPool::connect(&base_url)
        .await
        .expect("Failed to connect to admin database");

    sqlx::query(&format!("CREATE DATABASE \"{db_name}\""))
        .execute(&admin_pool)
        .await
        .expect("Failed to create test database");

    admin_pool.close().await;

    // Build connection URL for the test database
    let test_url = {
        let parts = base_url.rsplitn(2, '/').collect::<Vec<_>>();
        if parts.len() == 2 {
            format!("{}/{}", parts[1], db_name)
        } else {
            format!("{}/{}", base_url, db_name)
        }
    };

    let pool = PgPool::connect(&test_url)
        .await
        .expect("Failed to connect to test database");

    // Run migrations
    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    (pool, db_name)
}

/// Drops the test database.
pub async fn teardown_test_db(db_name: &str) {
    let base_url =
        std::env::var("TEST_DATABASE_URL").unwrap_or_else(|_| {
            std::env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set")
        });

    let admin_pool = PgPool::connect(&base_url)
        .await
        .expect("Failed to connect to admin database");

    // Terminate connections
    let _ = sqlx::query(&format!(
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '{db_name}'"
    ))
    .execute(&admin_pool)
    .await;

    let _ = sqlx::query(&format!("DROP DATABASE IF EXISTS \"{db_name}\""))
        .execute(&admin_pool)
        .await;

    admin_pool.close().await;
}

fn dummy_oauth_client() -> semleaf_backend::state::OAuthClient {
    let client_id = ClientId::new("test-client-id".to_string());
    let client_secret = ClientSecret::new("test-client-secret".to_string());
    let auth_url = AuthUrl::new("https://example.com/auth".to_string()).unwrap();
    let token_url = TokenUrl::new("https://example.com/token".to_string()).unwrap();
    let redirect_url = RedirectUrl::new("http://localhost:3000/callback".to_string()).unwrap();

    BasicClient::new(client_id)
        .set_client_secret(client_secret)
        .set_auth_uri(auth_url)
        .set_token_uri(token_url)
        .set_redirect_uri(redirect_url)
}

/// Builds the full router without authentication.
pub fn build_test_app(pool: PgPool) -> Router {
    let embedding: Arc<dyn Embedder> = Arc::new(FakeEmbedder);
    let state = AppState::new(pool, embedding, dummy_oauth_client(), vec![]);

    let session_layer = SessionManagerLayer::new(MemoryStore::default())
        .with_secure(false)
        .with_same_site(SameSite::Lax)
        .with_expiry(Expiry::OnInactivity(
            tower_sessions::cookie::time::Duration::days(1),
        ));

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

    Router::new().nest("/api", api).layer(session_layer)
}

/// Builds the full router with a pre-authenticated session.
/// Uses a middleware that injects the email into the session before the auth check.
pub fn build_test_app_authenticated(pool: PgPool) -> Router {
    let embedding: Arc<dyn Embedder> = Arc::new(FakeEmbedder);
    let state = AppState::new(pool, embedding, dummy_oauth_client(), vec![]);

    let session_layer = SessionManagerLayer::new(MemoryStore::default())
        .with_secure(false)
        .with_same_site(SameSite::Lax)
        .with_expiry(Expiry::OnInactivity(
            tower_sessions::cookie::time::Duration::days(1),
        ));

    let auth_routes = Router::new()
        .route("/google", get(auth::google_login))
        .route("/callback", get(auth::google_callback))
        .route("/logout", post(auth::logout))
        .route("/me", get(auth::me))
        .with_state(state.clone());

    let api = Router::new()
        .nest("/auth", auth_routes)
        .merge(routes::api_router(state))
        .layer(middleware::from_fn(auth::middleware::require_auth))
        .layer(middleware::from_fn(inject_test_session));

    Router::new().nest("/api", api).layer(session_layer)
}

async fn inject_test_session(
    session: tower_sessions::Session,
    request: axum::extract::Request,
    next: axum::middleware::Next,
) -> Result<axum::response::Response, AppError> {
    let _ = session.insert("email", "test@example.com").await;
    Ok(next.run(request).await)
}

/// Helper: send a request and return (StatusCode, body bytes).
pub async fn send_request(app: Router, request: Request<Body>) -> (StatusCode, bytes::Bytes) {
    let response = app.oneshot(request).await.unwrap();
    let status = response.status();
    let body = response.into_body().collect().await.unwrap().to_bytes();
    (status, body)
}

/// Helper: send a request and parse JSON response.
pub async fn send_json_request(
    app: Router,
    request: Request<Body>,
) -> (StatusCode, serde_json::Value) {
    let (status, body) = send_request(app, request).await;
    let json: serde_json::Value =
        serde_json::from_slice(&body).unwrap_or_else(|_| serde_json::json!(null));
    (status, json)
}

/// Build a JSON POST request.
pub fn json_post(uri: &str, body: &serde_json::Value) -> Request<Body> {
    Request::builder()
        .method(http::Method::POST)
        .uri(uri)
        .header("Content-Type", "application/json")
        .body(Body::from(serde_json::to_vec(body).unwrap()))
        .unwrap()
}

/// Build a JSON PUT request.
pub fn json_put(uri: &str, body: &serde_json::Value) -> Request<Body> {
    Request::builder()
        .method(http::Method::PUT)
        .uri(uri)
        .header("Content-Type", "application/json")
        .body(Body::from(serde_json::to_vec(body).unwrap()))
        .unwrap()
}

/// Build a GET request.
pub fn get_request(uri: &str) -> Request<Body> {
    Request::builder()
        .method(http::Method::GET)
        .uri(uri)
        .body(Body::empty())
        .unwrap()
}

/// Build a DELETE request.
pub fn delete_request(uri: &str) -> Request<Body> {
    Request::builder()
        .method(http::Method::DELETE)
        .uri(uri)
        .body(Body::empty())
        .unwrap()
}
