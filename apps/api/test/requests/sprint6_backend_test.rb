require "test_helper"

class Sprint6BackendTest < ActionDispatch::IntegrationTest
  test "dashboard snapshot returns honest sections, dependency status and SLO metadata" do
    token = login_as("admin@example.com", "StrongPass123!")

    get "/api/v1/analytics/dashboard",
        params: { preset: "last_7d", timezone: "UTC" },
        headers: auth_header(token)

    assert_response :ok
    assert_includes %w[live derived empty degraded], parsed_json.dig("data", "sections", "queue", "status")
    assert_includes %w[live derived empty degraded], parsed_json.dig("data", "sections", "workers", "status")
    assert_includes %w[healthy degraded unavailable], parsed_json.dig("data", "dependencies", "broker", "status")
    assert_equal 300, parsed_json.dig("data", "slo", "slo_target_seconds")
    assert parsed_json.dig("data", "slo").key?("stale")
  end

  test "warehouse falls back to postgres derived source with complete SLO metadata" do
    token = login_as("operator@example.com", "StrongPass123!")

    get "/api/v1/analytics/warehouse",
        params: { preset: "last_7d", timezone: "UTC" },
        headers: auth_header(token)

    assert_response :ok
    assert_equal "postgres_derived", parsed_json.dig("data", "source")
    assert_equal 300, parsed_json.dig("data", "slo_target_seconds")
    assert parsed_json.dig("data").key?("lag_seconds")
    assert parsed_json.dig("data").key?("p95_ms")
    assert parsed_json.dig("data").key?("error_budget_percent")
  end

  test "lineage requires job_id and returns batches attempts warnings and audit refs" do
    warning = OperationalWarning.create!(
      job: jobs(:pending_job),
      upload: uploads(:registered_upload),
      code: "analytics_load_failed",
      message: "ClickHouse load failed.",
      status: "open",
      severity: "warning",
      trace_id: "trace_fixture_1"
    )
    token = login_as("operator@example.com", "StrongPass123!")

    get "/api/v1/analytics/lineage", headers: auth_header(token)
    assert_response :unprocessable_entity

    get "/api/v1/analytics/lineage",
        params: { job_id: "job_fixture_pending" },
        headers: auth_header(token)

    assert_response :ok
    assert_equal "job_fixture_pending", parsed_json.dig("data", "job", "id")
    assert_equal [ "batch_fixture_first" ], parsed_json.dig("data", "batches").map { |entry| entry.fetch("id") }
    assert_includes parsed_json.dig("data", "warnings").map { |entry| entry.fetch("id") }, warning.id
    assert_kind_of Array, parsed_json.dig("data", "audit_refs")
  end

  test "public link creates external_link upload and job idempotently without exposing URL secrets" do
    token = login_as("operator@example.com", "StrongPass123!")
    idempotency_key = "sprint6-public-link-key"

    post "/api/v1/uploads/public-link",
         params: {
           public_link: {
             url: "https://data.example.com/export.csv?token=secret-token",
             filename: "export.csv",
             content_type: "text/csv",
             byte_size: 1024
           }
         },
         headers: auth_header(token).merge("Idempotency-Key" => idempotency_key),
         as: :json

    assert_response :created
    assert_equal "external_link", parsed_json.dig("data", "upload", "source_type")
    assert_equal "external_link", parsed_json.dig("data", "job", "source_type")
    assert_equal "pending", parsed_json.dig("data", "acquisition", "status")
    assert_equal "public_link", parsed_json.dig("data", "acquisition", "link_mode")
    refute_includes response.body, "secret-token"

    post "/api/v1/uploads/public-link",
         params: {
           public_link: {
             url: "https://data.example.com/export.csv?token=secret-token",
             filename: "export.csv",
             content_type: "text/csv",
             byte_size: 1024
           }
         },
         headers: auth_header(token).merge("Idempotency-Key" => idempotency_key),
         as: :json

    assert_response :created
    assert_equal true, parsed_json.dig("meta", "idempotent")
  end

  test "public link rejects private and localhost destinations before enqueueing" do
    token = login_as("operator@example.com", "StrongPass123!")

    post "/api/v1/uploads/public-link",
         params: { public_link: { url: "http://127.0.0.1/private.csv", filename: "private.csv", content_type: "text/csv" } },
         headers: auth_header(token).merge("Idempotency-Key" => "sprint6-ssrf-key"),
         as: :json

    assert_response :unprocessable_entity
    assert_equal "validation_failed", parsed_json.dig("error", "code")
    assert_equal "url", parsed_json.dig("error", "details", 0, "field")
  end

  private

  def parsed_json
    JSON.parse(response.body)
  end

  def auth_header(token)
    { "Authorization" => "Bearer #{token}" }
  end

  def login_as(email, password)
    post "/api/v1/auth/login",
         params: { session: { email: email, password: password } },
         as: :json

    assert_response :ok
    parsed_json.dig("data", "session", "access_token")
  end
end
