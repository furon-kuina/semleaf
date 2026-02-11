mod common;

use serde_json::json;

#[tokio::test]
async fn create_phrase_full_fields() {
    let (pool, db_name) = common::setup_test_db().await;
    let app = common::build_test_app_authenticated(pool.clone());

    let body = json!({
        "phrase": "serendipity",
        "meanings": ["the occurrence of happy events by chance", "good fortune"],
        "source": "Oxford Dictionary",
        "tags": ["vocabulary", "positive"],
        "memo": "Nice word"
    });

    let (status, json) = common::send_json_request(app, common::json_post("/api/phrases", &body)).await;
    assert_eq!(status, 200);
    assert_eq!(json["phrase"], "serendipity");
    assert_eq!(json["meanings"], json!(["the occurrence of happy events by chance", "good fortune"]));
    assert_eq!(json["source"], "Oxford Dictionary");
    assert_eq!(json["tags"], json!(["vocabulary", "positive"]));
    assert_eq!(json["memo"], "Nice word");
    assert!(json["id"].is_string());
    assert!(json["created_at"].is_string());
    assert!(json["updated_at"].is_string());
    // embedding must NOT be in the response
    assert!(json.get("meaning_embedding").is_none());

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn create_phrase_minimal_fields() {
    let (pool, db_name) = common::setup_test_db().await;
    let app = common::build_test_app_authenticated(pool.clone());

    let body = json!({
        "phrase": "hello",
        "meanings": ["a greeting"]
    });

    let (status, json) = common::send_json_request(app, common::json_post("/api/phrases", &body)).await;
    assert_eq!(status, 200);
    assert_eq!(json["phrase"], "hello");
    assert_eq!(json["source"], json!(null));
    assert_eq!(json["tags"], json!([]));
    assert_eq!(json["memo"], json!(null));

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn create_phrase_missing_required_field() {
    let (pool, db_name) = common::setup_test_db().await;
    let app = common::build_test_app_authenticated(pool.clone());

    let body = json!({
        "phrase": "hello"
        // missing "meanings"
    });

    let (status, _) = common::send_json_request(app, common::json_post("/api/phrases", &body)).await;
    assert_eq!(status, 422);

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn create_phrase_empty_meanings_rejected() {
    let (pool, db_name) = common::setup_test_db().await;
    let app = common::build_test_app_authenticated(pool.clone());

    let body = json!({
        "phrase": "hello",
        "meanings": []
    });

    let (status, _) = common::send_json_request(app, common::json_post("/api/phrases", &body)).await;
    assert_eq!(status, 400);

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn get_phrase_success() {
    let (pool, db_name) = common::setup_test_db().await;

    // Create a phrase first
    let app = common::build_test_app_authenticated(pool.clone());
    let body = json!({"phrase": "test", "meanings": ["a test"]});
    let (_, created) = common::send_json_request(app, common::json_post("/api/phrases", &body)).await;
    let id = created["id"].as_str().unwrap();

    // Fetch it
    let app = common::build_test_app_authenticated(pool.clone());
    let (status, json) = common::send_json_request(app, common::get_request(&format!("/api/phrases/{id}"))).await;
    assert_eq!(status, 200);
    assert_eq!(json["phrase"], "test");
    assert_eq!(json["meanings"], json!(["a test"]));

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn get_phrase_not_found() {
    let (pool, db_name) = common::setup_test_db().await;
    let app = common::build_test_app_authenticated(pool.clone());

    let fake_id = uuid::Uuid::new_v4();
    let (status, json) = common::send_json_request(app, common::get_request(&format!("/api/phrases/{fake_id}"))).await;
    assert_eq!(status, 404);
    assert!(json["error"].is_string());

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn update_phrase_partial() {
    let (pool, db_name) = common::setup_test_db().await;

    // Create
    let app = common::build_test_app_authenticated(pool.clone());
    let body = json!({"phrase": "original", "meanings": ["original meaning"], "source": "book"});
    let (_, created) = common::send_json_request(app, common::json_post("/api/phrases", &body)).await;
    let id = created["id"].as_str().unwrap();

    // Update only the phrase text
    let app = common::build_test_app_authenticated(pool.clone());
    let update = json!({"phrase": "updated"});
    let (status, json) = common::send_json_request(app, common::json_put(&format!("/api/phrases/{id}"), &update)).await;
    assert_eq!(status, 200);
    assert_eq!(json["phrase"], "updated");
    assert_eq!(json["meanings"], json!(["original meaning"])); // unchanged
    assert_eq!(json["source"], "book"); // unchanged

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn update_phrase_meanings() {
    let (pool, db_name) = common::setup_test_db().await;

    // Create
    let app = common::build_test_app_authenticated(pool.clone());
    let body = json!({"phrase": "test", "meanings": ["meaning one"]});
    let (_, created) = common::send_json_request(app, common::json_post("/api/phrases", &body)).await;
    let id = created["id"].as_str().unwrap();

    // Update meanings
    let app = common::build_test_app_authenticated(pool.clone());
    let update = json!({"meanings": ["new meaning one", "new meaning two"]});
    let (status, json) = common::send_json_request(app, common::json_put(&format!("/api/phrases/{id}"), &update)).await;
    assert_eq!(status, 200);
    assert_eq!(json["meanings"], json!(["new meaning one", "new meaning two"]));

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn update_phrase_not_found() {
    let (pool, db_name) = common::setup_test_db().await;
    let app = common::build_test_app_authenticated(pool.clone());

    let fake_id = uuid::Uuid::new_v4();
    let update = json!({"phrase": "nope"});
    let (status, _) = common::send_json_request(app, common::json_put(&format!("/api/phrases/{fake_id}"), &update)).await;
    assert_eq!(status, 404);

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn delete_phrase_success() {
    let (pool, db_name) = common::setup_test_db().await;

    // Create
    let app = common::build_test_app_authenticated(pool.clone());
    let body = json!({"phrase": "deleteme", "meanings": ["will be deleted"]});
    let (_, created) = common::send_json_request(app, common::json_post("/api/phrases", &body)).await;
    let id = created["id"].as_str().unwrap();

    // Delete
    let app = common::build_test_app_authenticated(pool.clone());
    let (status, json) = common::send_json_request(app, common::delete_request(&format!("/api/phrases/{id}"))).await;
    assert_eq!(status, 200);
    assert_eq!(json["ok"], true);

    // Verify it's gone
    let app = common::build_test_app_authenticated(pool.clone());
    let (status, _) = common::send_json_request(app, common::get_request(&format!("/api/phrases/{id}"))).await;
    assert_eq!(status, 404);

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn delete_phrase_not_found() {
    let (pool, db_name) = common::setup_test_db().await;
    let app = common::build_test_app_authenticated(pool.clone());

    let fake_id = uuid::Uuid::new_v4();
    let (status, _) = common::send_json_request(app, common::delete_request(&format!("/api/phrases/{fake_id}"))).await;
    assert_eq!(status, 404);

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn embedding_never_in_api_response() {
    let (pool, db_name) = common::setup_test_db().await;

    let app = common::build_test_app_authenticated(pool.clone());
    let body = json!({"phrase": "check", "meanings": ["checking embedding leak"]});
    let (_, body_bytes) = common::send_request(app, common::json_post("/api/phrases", &body)).await;
    let body_str = String::from_utf8_lossy(&body_bytes);
    assert!(!body_str.contains("meaning_embedding"));
    assert!(!body_str.contains("0.0,0.0"));

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}
