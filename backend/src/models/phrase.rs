use chrono::{DateTime, Utc};
use pgvector::Vector;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Database row with embedding vector.
#[derive(Debug, FromRow)]
pub struct PhraseRow {
    pub id: Uuid,
    pub phrase: String,
    pub meaning: String,
    pub source: Option<String>,
    pub tags: Vec<String>,
    pub memo: Option<String>,
    pub meaning_embedding: Vector,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// API response (no embedding).
#[derive(Debug, Serialize)]
pub struct Phrase {
    pub id: Uuid,
    pub phrase: String,
    pub meaning: String,
    pub source: Option<String>,
    pub tags: Vec<String>,
    pub memo: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<PhraseRow> for Phrase {
    fn from(row: PhraseRow) -> Self {
        Phrase {
            id: row.id,
            phrase: row.phrase,
            meaning: row.meaning,
            source: row.source,
            tags: row.tags,
            memo: row.memo,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreatePhraseRequest {
    pub phrase: String,
    pub meaning: String,
    pub source: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub memo: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePhraseRequest {
    pub phrase: Option<String>,
    pub meaning: Option<String>,
    pub source: Option<String>,
    pub tags: Option<Vec<String>>,
    pub memo: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SemanticSearchRequest {
    pub query: String,
    #[serde(default = "default_limit")]
    pub limit: i64,
}

fn default_limit() -> i64 {
    20
}

#[derive(Debug, Deserialize)]
pub struct TextSearchQuery {
    pub q: String,
    #[serde(default = "default_limit")]
    pub limit: i64,
}

#[derive(Debug, Deserialize)]
pub struct ExportQuery {
    #[serde(default = "default_format")]
    pub format: String,
}

fn default_format() -> String {
    "json".to_string()
}
