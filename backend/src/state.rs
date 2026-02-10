use crate::services::embedding::EmbeddingService;
use oauth2::basic::BasicClient;
use oauth2::{EndpointNotSet, EndpointSet};
use sqlx::PgPool;
use std::sync::Arc;

pub type OAuthClient = BasicClient<EndpointSet, EndpointNotSet, EndpointNotSet, EndpointNotSet, EndpointSet>;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub embedding: EmbeddingService,
    pub oauth_client: OAuthClient,
    pub allowed_emails: Vec<String>,
}

impl AppState {
    pub fn new(
        pool: PgPool,
        embedding: EmbeddingService,
        oauth_client: OAuthClient,
        allowed_emails: Vec<String>,
    ) -> Arc<Self> {
        Arc::new(Self {
            pool,
            embedding,
            oauth_client,
            allowed_emails,
        })
    }
}
