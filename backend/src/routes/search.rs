use std::sync::Arc;

use axum::Json;
use axum::extract::{Query, State};

use crate::error::AppError;
use crate::models::phrase::{Phrase, SemanticSearchRequest, TextSearchQuery};
use crate::services::db;
use crate::state::AppState;

pub async fn semantic_search(
    State(state): State<Arc<AppState>>,
    Json(req): Json<SemanticSearchRequest>,
) -> Result<Json<Vec<Phrase>>, AppError> {
    let query_embedding = state.embedding.embed(&req.query).await?;
    let rows = db::semantic_search(&state.pool, &query_embedding, req.limit).await?;
    let phrases: Vec<Phrase> = rows.into_iter().map(Phrase::from).collect();
    Ok(Json(phrases))
}

pub async fn text_search(
    State(state): State<Arc<AppState>>,
    Query(query): Query<TextSearchQuery>,
) -> Result<Json<Vec<Phrase>>, AppError> {
    let rows = db::text_search(&state.pool, &query.q, query.limit).await?;
    let phrases: Vec<Phrase> = rows.into_iter().map(Phrase::from).collect();
    Ok(Json(phrases))
}
