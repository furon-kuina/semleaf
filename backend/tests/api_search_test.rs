mod common;

use serde_json::json;

async fn seed_phrases(pool: &sqlx::PgPool) {
    let app = common::build_test_app_authenticated(pool.clone());
    let body = json!({"phrase": "ephemeral", "meanings": ["lasting for a very short time"], "tags": ["vocabulary"], "source": "GRE prep"});
    common::send_json_request(app, common::json_post("/api/phrases", &body)).await;

    let app = common::build_test_app_authenticated(pool.clone());
    let body = json!({"phrase": "ubiquitous", "meanings": ["present everywhere"], "tags": ["vocabulary", "common"]});
    common::send_json_request(app, common::json_post("/api/phrases", &body)).await;

    let app = common::build_test_app_authenticated(pool.clone());
    let body = json!({"phrase": "serendipity", "meanings": ["finding good things by chance"], "tags": ["positive"]});
    common::send_json_request(app, common::json_post("/api/phrases", &body)).await;
}

#[tokio::test]
async fn text_search_by_phrase() {
    let (pool, db_name) = common::setup_test_db().await;
    seed_phrases(&pool).await;

    let app = common::build_test_app_authenticated(pool.clone());
    let (status, json) = common::send_json_request(
        app,
        common::get_request("/api/search/text?q=ephemeral"),
    )
    .await;
    assert_eq!(status, 200);
    let results = json.as_array().unwrap();
    assert_eq!(results.len(), 1);
    assert_eq!(results[0]["phrase"], "ephemeral");

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn text_search_by_meaning() {
    let (pool, db_name) = common::setup_test_db().await;
    seed_phrases(&pool).await;

    let app = common::build_test_app_authenticated(pool.clone());
    let (status, json) = common::send_json_request(
        app,
        common::get_request("/api/search/text?q=everywhere"),
    )
    .await;
    assert_eq!(status, 200);
    let results = json.as_array().unwrap();
    assert_eq!(results.len(), 1);
    assert_eq!(results[0]["phrase"], "ubiquitous");

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn text_search_by_tag() {
    let (pool, db_name) = common::setup_test_db().await;
    seed_phrases(&pool).await;

    let app = common::build_test_app_authenticated(pool.clone());
    let (status, json) = common::send_json_request(
        app,
        common::get_request("/api/search/text?q=positive"),
    )
    .await;
    assert_eq!(status, 200);
    let results = json.as_array().unwrap();
    assert_eq!(results.len(), 1);
    assert_eq!(results[0]["phrase"], "serendipity");

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn text_search_case_insensitive() {
    let (pool, db_name) = common::setup_test_db().await;
    seed_phrases(&pool).await;

    let app = common::build_test_app_authenticated(pool.clone());
    let (status, json) = common::send_json_request(
        app,
        common::get_request("/api/search/text?q=EPHEMERAL"),
    )
    .await;
    assert_eq!(status, 200);
    let results = json.as_array().unwrap();
    assert_eq!(results.len(), 1);

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn text_search_respects_limit() {
    let (pool, db_name) = common::setup_test_db().await;
    seed_phrases(&pool).await;

    let app = common::build_test_app_authenticated(pool.clone());
    let (status, json) = common::send_json_request(
        app,
        common::get_request("/api/search/text?q=vocabulary&limit=1"),
    )
    .await;
    assert_eq!(status, 200);
    let results = json.as_array().unwrap();
    assert_eq!(results.len(), 1);

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn text_search_no_match() {
    let (pool, db_name) = common::setup_test_db().await;
    seed_phrases(&pool).await;

    let app = common::build_test_app_authenticated(pool.clone());
    let (status, json) = common::send_json_request(
        app,
        common::get_request("/api/search/text?q=zzzznonexistent"),
    )
    .await;
    assert_eq!(status, 200);
    let results = json.as_array().unwrap();
    assert!(results.is_empty());

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn semantic_search_returns_results() {
    let (pool, db_name) = common::setup_test_db().await;
    seed_phrases(&pool).await;

    let app = common::build_test_app_authenticated(pool.clone());
    let body = json!({"query": "short duration", "limit": 2});
    let (status, json) = common::send_json_request(
        app,
        common::json_post("/api/search/semantic", &body),
    )
    .await;
    assert_eq!(status, 200);
    let results = json.as_array().unwrap();
    assert_eq!(results.len(), 2);

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}
