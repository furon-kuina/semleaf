use axum::extract::Request;
use axum::middleware::Next;
use axum::response::Response;
use tower_sessions::Session;

use crate::error::AppError;

pub async fn require_auth(
    session: Session,
    request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let path = request.uri().path();

    // Skip auth for public endpoints
    if path.starts_with("/api/auth/") || path == "/api/health" {
        return Ok(next.run(request).await);
    }

    let email: Option<String> = session
        .get("email")
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;

    if email.is_none() {
        return Err(AppError::Unauthorized);
    }

    Ok(next.run(request).await)
}
