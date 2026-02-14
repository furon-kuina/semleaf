mod common;

use serde_json::json;

#[tokio::test]
async fn export_json_default() {
    let (pool, db_name) = common::setup_test_db().await;

    // Seed data
    let app = common::build_test_app_authenticated(pool.clone());
    let body = json!({"phrase": "hello", "meanings": ["a greeting"], "tags": ["common"]});
    common::send_json_request(app, common::json_post("/api/phrases", &body)).await;

    // Export
    let app = common::build_test_app_authenticated(pool.clone());
    let (status, body) = common::send_request(app, common::get_request("/api/export")).await;
    assert_eq!(status, 200);

    let body_str = String::from_utf8_lossy(&body);
    let phrases: Vec<serde_json::Value> = serde_json::from_str(&body_str).unwrap();
    assert_eq!(phrases.len(), 1);
    assert_eq!(phrases[0]["phrase"], "hello");
    assert_eq!(phrases[0]["meanings"], json!(["a greeting"]));

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn export_json_content_disposition() {
    let (pool, db_name) = common::setup_test_db().await;

    let app = common::build_test_app_authenticated(pool.clone());
    let response = tower::ServiceExt::oneshot(app, common::get_request("/api/export?format=json"))
        .await
        .unwrap();
    assert_eq!(response.status(), 200);

    let content_type = response
        .headers()
        .get("content-type")
        .unwrap()
        .to_str()
        .unwrap();
    assert!(content_type.contains("application/json"));

    let content_disp = response
        .headers()
        .get("content-disposition")
        .unwrap()
        .to_str()
        .unwrap();
    assert!(content_disp.contains("eemee-export.json"));

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn export_csv() {
    let (pool, db_name) = common::setup_test_db().await;

    // Seed
    let app = common::build_test_app_authenticated(pool.clone());
    let body = json!({"phrase": "test", "meanings": ["a test", "an exam"], "source": "src", "tags": ["tag1"]});
    common::send_json_request(app, common::json_post("/api/phrases", &body)).await;

    let app = common::build_test_app_authenticated(pool.clone());
    let response = tower::ServiceExt::oneshot(app, common::get_request("/api/export?format=csv"))
        .await
        .unwrap();
    assert_eq!(response.status(), 200);

    let content_type = response
        .headers()
        .get("content-type")
        .unwrap()
        .to_str()
        .unwrap();
    assert!(content_type.contains("text/csv"));

    let body = http_body_util::BodyExt::collect(response.into_body())
        .await
        .unwrap()
        .to_bytes();
    let csv_str = String::from_utf8_lossy(&body);

    // Check header row
    assert!(csv_str.starts_with("id,phrase,meanings,source,tags,memo,created_at,updated_at"));
    // Check data row contains our phrase and meanings joined with " | "
    assert!(csv_str.contains("test"));
    assert!(csv_str.contains("a test | an exam"));

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn export_empty_database() {
    let (pool, db_name) = common::setup_test_db().await;

    let app = common::build_test_app_authenticated(pool.clone());
    let (status, body) = common::send_request(app, common::get_request("/api/export")).await;
    assert_eq!(status, 200);

    let body_str = String::from_utf8_lossy(&body);
    let phrases: Vec<serde_json::Value> = serde_json::from_str(&body_str).unwrap();
    assert!(phrases.is_empty());

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}
