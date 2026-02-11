use crate::error::AppError;
use crate::models::phrase::PhraseWithMeaningsRow;
use pgvector::Vector;
use sqlx::PgPool;
use uuid::Uuid;

const PHRASE_WITH_MEANINGS_QUERY: &str =
    "SELECT p.id, p.phrase, p.source, p.tags, p.memo, p.created_at, p.updated_at,
            array_agg(pm.meaning ORDER BY pm.created_at) as meanings
     FROM phrases p
     JOIN phrase_meanings pm ON pm.phrase_id = p.id";

pub async fn create_phrase(
    pool: &PgPool,
    phrase: &str,
    meanings: &[String],
    source: Option<&str>,
    tags: &[String],
    memo: Option<&str>,
    embeddings: &[Vector],
) -> Result<PhraseWithMeaningsRow, AppError> {
    let mut tx = pool.begin().await?;

    let row = sqlx::query_as::<_, crate::models::phrase::PhraseRow>(
        "INSERT INTO phrases (phrase, source, tags, memo)
         VALUES ($1, $2, $3, $4)
         RETURNING *",
    )
    .bind(phrase)
    .bind(source)
    .bind(tags)
    .bind(memo)
    .fetch_one(&mut *tx)
    .await?;

    for (meaning, embedding) in meanings.iter().zip(embeddings.iter()) {
        sqlx::query(
            "INSERT INTO phrase_meanings (phrase_id, meaning, meaning_embedding)
             VALUES ($1, $2, $3)",
        )
        .bind(row.id)
        .bind(meaning)
        .bind(embedding)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    get_phrase(pool, row.id).await
}

pub async fn get_phrase(pool: &PgPool, id: Uuid) -> Result<PhraseWithMeaningsRow, AppError> {
    let query = format!(
        "{PHRASE_WITH_MEANINGS_QUERY}
         WHERE p.id = $1
         GROUP BY p.id, p.phrase, p.source, p.tags, p.memo, p.created_at, p.updated_at"
    );

    let row = sqlx::query_as::<_, PhraseWithMeaningsRow>(&query)
        .bind(id)
        .fetch_optional(pool)
        .await?
        .ok_or(AppError::NotFound)?;
    Ok(row)
}

#[allow(clippy::too_many_arguments)]
pub async fn update_phrase(
    pool: &PgPool,
    id: Uuid,
    phrase: Option<&str>,
    source: Option<&str>,
    tags: Option<&[String]>,
    memo: Option<&str>,
    meanings: Option<&[String]>,
    embeddings: Option<&[Vector]>,
) -> Result<PhraseWithMeaningsRow, AppError> {
    let existing = get_phrase(pool, id).await?;

    let mut tx = pool.begin().await?;

    let new_phrase = phrase.unwrap_or(&existing.phrase);
    let new_source = source.or(existing.source.as_deref());
    let new_tags = tags.unwrap_or(&existing.tags);
    let new_memo = memo.or(existing.memo.as_deref());

    sqlx::query(
        "UPDATE phrases
         SET phrase = $1, source = $2, tags = $3, memo = $4, updated_at = now()
         WHERE id = $5",
    )
    .bind(new_phrase)
    .bind(new_source)
    .bind(new_tags)
    .bind(new_memo)
    .bind(id)
    .execute(&mut *tx)
    .await?;

    if let (Some(meanings), Some(embeddings)) = (meanings, embeddings) {
        sqlx::query("DELETE FROM phrase_meanings WHERE phrase_id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await?;

        for (meaning, embedding) in meanings.iter().zip(embeddings.iter()) {
            sqlx::query(
                "INSERT INTO phrase_meanings (phrase_id, meaning, meaning_embedding)
                 VALUES ($1, $2, $3)",
            )
            .bind(id)
            .bind(meaning)
            .bind(embedding)
            .execute(&mut *tx)
            .await?;
        }
    }

    tx.commit().await?;

    get_phrase(pool, id).await
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
) -> Result<Vec<PhraseWithMeaningsRow>, AppError> {
    let query = format!(
        "{PHRASE_WITH_MEANINGS_QUERY}
         GROUP BY p.id, p.phrase, p.source, p.tags, p.memo, p.created_at, p.updated_at
         ORDER BY MIN(pm.meaning_embedding <=> $1)
         LIMIT $2"
    );

    let rows = sqlx::query_as::<_, PhraseWithMeaningsRow>(&query)
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
) -> Result<Vec<PhraseWithMeaningsRow>, AppError> {
    let pattern = format!("%{query}%");
    let query_str = format!(
        "{PHRASE_WITH_MEANINGS_QUERY}
         WHERE p.phrase ILIKE $1
            OR p.source ILIKE $1
            OR EXISTS (SELECT 1 FROM unnest(p.tags) AS t WHERE t ILIKE $1)
            OR EXISTS (SELECT 1 FROM phrase_meanings pm2 WHERE pm2.phrase_id = p.id AND pm2.meaning ILIKE $1)
         GROUP BY p.id, p.phrase, p.source, p.tags, p.memo, p.created_at, p.updated_at
         ORDER BY p.updated_at DESC
         LIMIT $2"
    );

    let rows = sqlx::query_as::<_, PhraseWithMeaningsRow>(&query_str)
        .bind(&pattern)
        .bind(limit)
        .fetch_all(pool)
        .await?;
    Ok(rows)
}

pub async fn get_all_phrases(pool: &PgPool) -> Result<Vec<PhraseWithMeaningsRow>, AppError> {
    let query = format!(
        "{PHRASE_WITH_MEANINGS_QUERY}
         GROUP BY p.id, p.phrase, p.source, p.tags, p.memo, p.created_at, p.updated_at
         ORDER BY p.created_at DESC"
    );

    let rows = sqlx::query_as::<_, PhraseWithMeaningsRow>(&query)
        .fetch_all(pool)
        .await?;
    Ok(rows)
}
