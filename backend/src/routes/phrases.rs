use std::sync::Arc;

use axum::extract::{Path, State};
use axum::Json;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::phrase::{CreatePhraseRequest, Phrase, UpdatePhraseRequest};
use crate::services::db;
use crate::state::AppState;

pub async fn create_phrase(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreatePhraseRequest>,
) -> Result<Json<Phrase>, AppError> {
    let embedding = state.embedding.embed(&req.meaning).await?;
    let row = db::create_phrase(
        &state.pool,
        &req.phrase,
        &req.meaning,
        req.source.as_deref(),
        &req.tags,
        req.memo.as_deref(),
        &embedding,
    )
    .await?;
    Ok(Json(Phrase::from(row)))
}

pub async fn get_phrase(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Phrase>, AppError> {
    let row = db::get_phrase(&state.pool, id).await?;
    Ok(Json(Phrase::from(row)))
}

pub async fn update_phrase(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdatePhraseRequest>,
) -> Result<Json<Phrase>, AppError> {
    let embedding = match &req.meaning {
        Some(meaning) => Some(state.embedding.embed(meaning).await?),
        None => None,
    };

    let row = db::update_phrase(
        &state.pool,
        id,
        req.phrase.as_deref(),
        req.meaning.as_deref(),
        req.source.as_deref(),
        req.tags.as_deref(),
        req.memo.as_deref(),
        embedding.as_ref(),
    )
    .await?;
    Ok(Json(Phrase::from(row)))
}

pub async fn delete_phrase(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    db::delete_phrase(&state.pool, id).await?;
    Ok(Json(serde_json::json!({ "ok": true })))
}
