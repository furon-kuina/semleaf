use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Database row for the phrases table (no meaning/embedding columns after migration).
#[derive(Debug, FromRow)]
pub struct PhraseRow {
    pub id: Uuid,
    pub phrase: String,
    pub source: Option<String>,
    pub tags: Vec<String>,
    pub memo: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Joined query result with aggregated meanings.
#[derive(Debug, FromRow)]
pub struct PhraseWithMeaningsRow {
    pub id: Uuid,
    pub phrase: String,
    pub source: Option<String>,
    pub tags: Vec<String>,
    pub memo: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub meanings: Vec<String>,
}

/// API response (no embedding).
#[derive(Debug, Serialize)]
pub struct Phrase {
    pub id: Uuid,
    pub phrase: String,
    pub meanings: Vec<String>,
    pub source: Option<String>,
    pub tags: Vec<String>,
    pub memo: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<PhraseWithMeaningsRow> for Phrase {
    fn from(row: PhraseWithMeaningsRow) -> Self {
        Phrase {
            id: row.id,
            phrase: row.phrase,
            meanings: row.meanings,
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
    pub meanings: Vec<String>,
    pub source: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub memo: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePhraseRequest {
    pub phrase: Option<String>,
    pub meanings: Option<Vec<String>>,
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

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    #[test]
    fn phrase_with_meanings_row_to_phrase_preserves_all_fields() {
        let now = Utc::now();
        let id = Uuid::new_v4();
        let row = PhraseWithMeaningsRow {
            id,
            phrase: "hello".to_string(),
            meanings: vec!["a greeting".to_string(), "an exclamation".to_string()],
            source: Some("dictionary".to_string()),
            tags: vec!["greetings".to_string(), "common".to_string()],
            memo: Some("used frequently".to_string()),
            created_at: now,
            updated_at: now,
        };

        let phrase: Phrase = row.into();
        assert_eq!(phrase.id, id);
        assert_eq!(phrase.phrase, "hello");
        assert_eq!(phrase.meanings, vec!["a greeting", "an exclamation"]);
        assert_eq!(phrase.source, Some("dictionary".to_string()));
        assert_eq!(phrase.tags, vec!["greetings", "common"]);
        assert_eq!(phrase.memo, Some("used frequently".to_string()));
        assert_eq!(phrase.created_at, now);
        assert_eq!(phrase.updated_at, now);
    }

    #[test]
    fn phrase_with_meanings_row_to_phrase_with_none_fields() {
        let now = Utc::now();
        let row = PhraseWithMeaningsRow {
            id: Uuid::new_v4(),
            phrase: "test".to_string(),
            meanings: vec!["a test".to_string()],
            source: None,
            tags: vec![],
            memo: None,
            created_at: now,
            updated_at: now,
        };

        let phrase: Phrase = row.into();
        assert_eq!(phrase.source, None);
        assert_eq!(phrase.memo, None);
        assert!(phrase.tags.is_empty());
    }

    #[test]
    fn phrase_serialization_has_no_embedding() {
        let row = PhraseWithMeaningsRow {
            id: Uuid::new_v4(),
            phrase: "test".to_string(),
            meanings: vec!["a test".to_string()],
            source: None,
            tags: vec![],
            memo: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let phrase: Phrase = row.into();
        let json = serde_json::to_string(&phrase).unwrap();
        assert!(!json.contains("embedding"));
    }

    #[test]
    fn create_phrase_request_deserialize_minimal() {
        let json = r#"{"phrase":"hello","meanings":["a greeting"]}"#;
        let req: CreatePhraseRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.phrase, "hello");
        assert_eq!(req.meanings, vec!["a greeting"]);
        assert_eq!(req.source, None);
        assert!(req.tags.is_empty());
        assert_eq!(req.memo, None);
    }

    #[test]
    fn create_phrase_request_deserialize_full() {
        let json = r#"{"phrase":"hello","meanings":["a greeting","an exclamation"],"source":"dict","tags":["a","b"],"memo":"note"}"#;
        let req: CreatePhraseRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.source, Some("dict".to_string()));
        assert_eq!(req.meanings, vec!["a greeting", "an exclamation"]);
        assert_eq!(req.tags, vec!["a", "b"]);
        assert_eq!(req.memo, Some("note".to_string()));
    }

    #[test]
    fn update_phrase_request_all_none() {
        let json = r#"{}"#;
        let req: UpdatePhraseRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.phrase, None);
        assert_eq!(req.meanings, None);
        assert_eq!(req.source, None);
        assert_eq!(req.tags, None);
        assert_eq!(req.memo, None);
    }

    #[test]
    fn semantic_search_request_default_limit() {
        let json = r#"{"query":"test"}"#;
        let req: SemanticSearchRequest = serde_json::from_str(json).unwrap();
        assert_eq!(req.query, "test");
        assert_eq!(req.limit, 20);
    }

    #[test]
    fn text_search_query_default_limit() {
        let query: TextSearchQuery = serde_json::from_str(r#"{"q":"hello"}"#).unwrap();
        assert_eq!(query.q, "hello");
        assert_eq!(query.limit, 20);
    }

    #[test]
    fn export_query_default_format() {
        let json = r#"{}"#;
        let query: ExportQuery = serde_json::from_str(json).unwrap();
        assert_eq!(query.format, "json");
    }
}
