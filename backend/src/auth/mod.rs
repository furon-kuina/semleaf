pub mod middleware;

use std::sync::Arc;

use axum::extract::Query;
use axum::extract::State;
use axum::response::{IntoResponse, Redirect, Response};
use axum::Json;
use oauth2::{AuthorizationCode, CsrfToken, Scope, TokenResponse};
use serde::Deserialize;
use tower_sessions::Session;

use crate::error::AppError;
use crate::state::AppState;

const SESSION_EMAIL_KEY: &str = "email";

#[derive(Deserialize)]
pub struct CallbackQuery {
    code: String,
    #[allow(dead_code)]
    state: String,
}

#[derive(Deserialize)]
struct GoogleUserInfo {
    email: String,
}

pub async fn google_login(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let (auth_url, _csrf_token) = state
        .oauth_client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("email".to_string()))
        .add_scope(Scope::new("profile".to_string()))
        .url();

    Redirect::temporary(auth_url.as_str())
}

pub async fn google_callback(
    State(state): State<Arc<AppState>>,
    session: Session,
    Query(query): Query<CallbackQuery>,
) -> Result<Response, AppError> {
    let token = state
        .oauth_client
        .exchange_code(AuthorizationCode::new(query.code))
        .request_async(&reqwest::Client::new())
        .await
        .map_err(|e| AppError::Internal(format!("Token exchange failed: {e}")))?;

    let client = reqwest::Client::new();
    let user_info: GoogleUserInfo = client
        .get("https://www.googleapis.com/oauth2/v2/userinfo")
        .bearer_auth(token.access_token().secret())
        .send()
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?
        .json()
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    if !state.allowed_emails.contains(&user_info.email) {
        return Err(AppError::Forbidden(format!(
            "Email {} is not allowed",
            user_info.email
        )));
    }

    session
        .insert(SESSION_EMAIL_KEY, &user_info.email)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(Redirect::temporary("/").into_response())
}

pub async fn logout(session: Session) -> Result<Json<serde_json::Value>, AppError> {
    session
        .flush()
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn me(session: Session) -> Result<Json<serde_json::Value>, AppError> {
    let email: Option<String> = session
        .get(SESSION_EMAIL_KEY)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    match email {
        Some(email) => Ok(Json(
            serde_json::json!({ "authenticated": true, "email": email }),
        )),
        None => Ok(Json(serde_json::json!({ "authenticated": false }))),
    }
}
