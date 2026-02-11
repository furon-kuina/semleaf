use std::future::Future;
use std::pin::Pin;

use crate::error::AppError;
use pgvector::Vector;
use serde::{Deserialize, Serialize};

pub trait Embedder: Send + Sync {
    fn embed<'a>(
        &'a self,
        text: &'a str,
    ) -> Pin<Box<dyn Future<Output = Result<Vector, AppError>> + Send + 'a>>;
}

#[derive(Clone)]
pub struct EmbeddingService {
    client: reqwest::Client,
    api_key: String,
}

#[derive(Serialize)]
struct EmbeddingRequest {
    model: String,
    input: String,
}

#[derive(Deserialize)]
struct EmbeddingResponse {
    data: Vec<EmbeddingData>,
}

#[derive(Deserialize)]
struct EmbeddingData {
    embedding: Vec<f32>,
}

impl EmbeddingService {
    pub fn new(api_key: String) -> Self {
        Self {
            client: reqwest::Client::new(),
            api_key,
        }
    }

    async fn embed_impl(&self, text: &str) -> Result<Vector, AppError> {
        let request = EmbeddingRequest {
            model: "text-embedding-3-large".to_string(),
            input: text.to_string(),
        };

        let response = self
            .client
            .post("https://api.openai.com/v1/embeddings")
            .bearer_auth(&self.api_key)
            .json(&request)
            .send()
            .await
            .map_err(|e| AppError::Embedding(e.to_string()))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response
                .text()
                .await
                .unwrap_or_else(|_| "unknown".to_string());
            return Err(AppError::Embedding(format!(
                "OpenAI API error {status}: {body}"
            )));
        }

        let result: EmbeddingResponse = response
            .json()
            .await
            .map_err(|e| AppError::Embedding(e.to_string()))?;

        let embedding = result
            .data
            .into_iter()
            .next()
            .ok_or_else(|| AppError::Embedding("No embedding returned".to_string()))?;

        Ok(Vector::from(embedding.embedding))
    }
}

impl Embedder for EmbeddingService {
    fn embed<'a>(
        &'a self,
        text: &'a str,
    ) -> Pin<Box<dyn Future<Output = Result<Vector, AppError>> + Send + 'a>> {
        Box::pin(self.embed_impl(text))
    }
}
