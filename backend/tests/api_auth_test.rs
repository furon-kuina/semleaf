mod common;

#[tokio::test]
async fn unauthenticated_request_to_phrases_returns_401() {
    let (pool, db_name) = common::setup_test_db().await;
    let app = common::build_test_app(pool.clone());

    let (status, json) = common::send_json_request(
        app,
        common::get_request("/api/phrases/00000000-0000-0000-0000-000000000000"),
    )
    .await;
    assert_eq!(status, 401);
    assert_eq!(json["error"], "Unauthorized");

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn unauthenticated_request_to_search_returns_401() {
    let (pool, db_name) = common::setup_test_db().await;
    let app = common::build_test_app(pool.clone());

    let (status, _) =
        common::send_json_request(app, common::get_request("/api/search/text?q=test")).await;
    assert_eq!(status, 401);

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn health_endpoint_skips_auth() {
    let (pool, db_name) = common::setup_test_db().await;
    let app = common::build_test_app(pool.clone());

    let (status, body) = common::send_request(app, common::get_request("/api/health")).await;
    assert_eq!(status, 200);
    assert_eq!(&body[..], b"ok");

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn auth_me_unauthenticated() {
    let (pool, db_name) = common::setup_test_db().await;
    let app = common::build_test_app(pool.clone());

    let (status, json) = common::send_json_request(app, common::get_request("/api/auth/me")).await;
    assert_eq!(status, 200);
    assert_eq!(json["authenticated"], false);

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}

#[tokio::test]
async fn auth_me_authenticated() {
    let (pool, db_name) = common::setup_test_db().await;
    let app = common::build_test_app_authenticated(pool.clone());

    let (status, json) = common::send_json_request(app, common::get_request("/api/auth/me")).await;
    assert_eq!(status, 200);
    assert_eq!(json["authenticated"], true);
    assert_eq!(json["email"], "test@example.com");

    pool.close().await;
    common::teardown_test_db(&db_name).await;
}
