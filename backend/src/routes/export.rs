use std::sync::Arc;

use axum::extract::{Query, State};
use axum::http::header;
use axum::response::{IntoResponse, Response};

use crate::error::AppError;
use crate::models::phrase::{ExportQuery, Phrase};
use crate::services::db;
use crate::state::AppState;

pub async fn export(
    State(state): State<Arc<AppState>>,
    Query(query): Query<ExportQuery>,
) -> Result<Response, AppError> {
    let rows = db::get_all_phrases(&state.pool).await?;
    let phrases: Vec<Phrase> = rows.into_iter().map(Phrase::from).collect();

    match query.format.as_str() {
        "csv" => {
            let mut writer = csv::Writer::from_writer(Vec::new());
            // Header
            writer
                .write_record([
                    "id",
                    "phrase",
                    "meanings",
                    "source",
                    "tags",
                    "memo",
                    "created_at",
                    "updated_at",
                ])
                .map_err(|e| AppError::Internal(e.to_string()))?;

            for p in &phrases {
                writer
                    .write_record([
                        &p.id.to_string(),
                        &p.phrase,
                        &p.meanings.join(" | "),
                        p.source.as_deref().unwrap_or(""),
                        &p.tags.join(", "),
                        p.memo.as_deref().unwrap_or(""),
                        &p.created_at.to_rfc3339(),
                        &p.updated_at.to_rfc3339(),
                    ])
                    .map_err(|e| AppError::Internal(e.to_string()))?;
            }

            let csv_data = writer
                .into_inner()
                .map_err(|e| AppError::Internal(e.to_string()))?;

            Ok((
                [
                    (header::CONTENT_TYPE, "text/csv; charset=utf-8"),
                    (
                        header::CONTENT_DISPOSITION,
                        "attachment; filename=\"eemee-export.csv\"",
                    ),
                ],
                csv_data,
            )
                .into_response())
        }
        _ => {
            let json_data = serde_json::to_string_pretty(&phrases)
                .map_err(|e| AppError::Internal(e.to_string()))?;
            Ok((
                [
                    (header::CONTENT_TYPE, "application/json; charset=utf-8"),
                    (
                        header::CONTENT_DISPOSITION,
                        "attachment; filename=\"eemee-export.json\"",
                    ),
                ],
                json_data,
            )
                .into_response())
        }
    }
}
