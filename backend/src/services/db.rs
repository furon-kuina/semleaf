use crate::error::AppError;
use crate::models::phrase::PhraseRow;
use pgvector::Vector;
use sqlx::PgPool;
use uuid::Uuid;

pub async fn create_phrase(
    pool: &PgPool,
    phrase: &str,
    meaning: &str,
    source: Option<&str>,
    tags: &[String],
    memo: Option<&str>,
    embedding: &Vector,
) -> Result<PhraseRow, AppError> {
    let row = sqlx::query_as::<_, PhraseRow>(
        "INSERT INTO phrases (phrase, meaning, source, tags, memo, meaning_embedding)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *",
    )
    .bind(phrase)
    .bind(meaning)
    .bind(source)
    .bind(tags)
    .bind(memo)
    .bind(embedding)
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn get_phrase(pool: &PgPool, id: Uuid) -> Result<PhraseRow, AppError> {
    let row = sqlx::query_as::<_, PhraseRow>("SELECT * FROM phrases WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or(AppError::NotFound)?;
    Ok(row)
}

pub async fn update_phrase(
    pool: &PgPool,
    id: Uuid,
    phrase: Option<&str>,
    meaning: Option<&str>,
    source: Option<&str>,
    tags: Option<&[String]>,
    memo: Option<&str>,
    embedding: Option<&Vector>,
) -> Result<PhraseRow, AppError> {
    // Build update dynamically - fetch existing first
    let existing = get_phrase(pool, id).await?;

    let new_phrase = phrase.unwrap_or(&existing.phrase);
    let new_meaning = meaning.unwrap_or(&existing.meaning);
    let new_source = source.or(existing.source.as_deref());
    let new_tags = tags.unwrap_or(&existing.tags);
    let new_memo = memo.or(existing.memo.as_deref());
    let new_embedding = embedding.unwrap_or(&existing.meaning_embedding);

    let row = sqlx::query_as::<_, PhraseRow>(
        "UPDATE phrases
         SET phrase = $1, meaning = $2, source = $3, tags = $4, memo = $5,
             meaning_embedding = $6, updated_at = now()
         WHERE id = $7
         RETURNING *",
    )
    .bind(new_phrase)
    .bind(new_meaning)
    .bind(new_source)
    .bind(new_tags)
    .bind(new_memo)
    .bind(new_embedding)
    .bind(id)
    .fetch_one(pool)
    .await?;
    Ok(row)
}

pub async fn delete_phrase(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    let result = sqlx::query("DELETE FROM phrases WHERE id = $1")
        .bind(id)
        .execute(pool)
        .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}

pub async fn semantic_search(
    pool: &PgPool,
    query_embedding: &Vector,
    limit: i64,
) -> Result<Vec<PhraseRow>, AppError> {
    let rows = sqlx::query_as::<_, PhraseRow>(
        "SELECT * FROM phrases
         ORDER BY meaning_embedding <=> $1
         LIMIT $2",
    )
    .bind(query_embedding)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn text_search(
    pool: &PgPool,
    query: &str,
    limit: i64,
) -> Result<Vec<PhraseRow>, AppError> {
    let pattern = format!("%{query}%");
    let rows = sqlx::query_as::<_, PhraseRow>(
        "SELECT * FROM phrases
         WHERE phrase ILIKE $1
            OR meaning ILIKE $1
            OR source ILIKE $1
            OR EXISTS (SELECT 1 FROM unnest(tags) AS t WHERE t ILIKE $1)
         ORDER BY updated_at DESC
         LIMIT $2",
    )
    .bind(&pattern)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn get_all_phrases(pool: &PgPool) -> Result<Vec<PhraseRow>, AppError> {
    let rows = sqlx::query_as::<_, PhraseRow>(
        "SELECT * FROM phrases ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await?;
    Ok(rows)
}
