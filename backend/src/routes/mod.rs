pub mod export;
pub mod phrases;
pub mod search;

use std::sync::Arc;

use axum::Router;
use axum::routing::{get, post};

use crate::state::AppState;

pub fn api_router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/health", get(health))
        .route(
            "/phrases",
            get(phrases::list_random_phrases).post(phrases::create_phrase),
        )
        .route(
            "/phrases/{id}",
            get(phrases::get_phrase)
                .put(phrases::update_phrase)
                .delete(phrases::delete_phrase),
        )
        .route("/search/semantic", post(search::semantic_search))
        .route("/search/text", get(search::text_search))
        .route("/export", get(export::export))
        .with_state(state)
}

async fn health() -> &'static str {
    "ok"
}
