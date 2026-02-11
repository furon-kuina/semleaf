use std::sync::Arc;

use axum::Json;
use axum::extract::{Path, Query, State};
use uuid::Uuid;

use crate::error::AppError;
use crate::models::phrase::{CreatePhraseRequest, Phrase, UpdatePhraseRequest};
use crate::services::db;
use crate::state::AppState;

#[derive(serde::Deserialize)]
pub struct ListPhrasesQuery {
    pub limit: Option<i64>,
}

pub async fn list_random_phrases(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ListPhrasesQuery>,
) -> Result<Json<Vec<Phrase>>, AppError> {
    let limit = query.limit.unwrap_or(20);
    let rows = db::get_random_phrases(&state.pool, limit).await?;
    Ok(Json(rows.into_iter().map(Phrase::from).collect()))
}

pub async fn create_phrase(
    State(state): State<Arc<AppState>>,
    Json(req): Json<CreatePhraseRequest>,
) -> Result<Json<Phrase>, AppError> {
    if req.meanings.is_empty() || req.meanings.iter().any(|m| m.trim().is_empty()) {
        return Err(AppError::BadRequest(
            "At least one non-empty meaning is required".to_string(),
        ));
    }

    let mut embeddings = Vec::with_capacity(req.meanings.len());
    for meaning in &req.meanings {
        embeddings.push(state.embedding.embed(meaning).await?);
    }

    let row = db::create_phrase(
        &state.pool,
        &req.phrase,
        &req.meanings,
        req.source.as_deref(),
        &req.tags,
        req.memo.as_deref(),
        &embeddings,
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
    let (meanings, embeddings) = match &req.meanings {
        Some(meanings) => {
            if meanings.is_empty() || meanings.iter().any(|m| m.trim().is_empty()) {
                return Err(AppError::BadRequest(
                    "At least one non-empty meaning is required".to_string(),
                ));
            }
            let mut embs = Vec::with_capacity(meanings.len());
            for meaning in meanings {
                embs.push(state.embedding.embed(meaning).await?);
            }
            (Some(meanings.as_slice()), Some(embs))
        }
        None => (None, None),
    };

    let row = db::update_phrase(
        &state.pool,
        id,
        req.phrase.as_deref(),
        req.source.as_deref(),
        req.tags.as_deref(),
        req.memo.as_deref(),
        meanings,
        embeddings.as_deref(),
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
