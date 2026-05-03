require "test_helper"

class BackendContractTest < ActionDispatch::IntegrationTest
  test "dashboard snapshot returns honest sections, dependency status and SLO metadata" do
    token = login_as("admin@example.com", "StrongPass123!")
    WorkerProcessingMetric.create!(
      job: jobs(:pending_job),
      event_id: "event_dashboard_metric",
      status: "processed",
      retry_count: 0,
      moved_to_dlq: false,
      processing_latency_ms: 42,
      trace_id: "trace_fixture_1",
      processed_at: Time.zone.parse("2026-04-05 10:02:00")
    )

    get "/api/v1/analytics/dashboard",
        params: analytics_fixture_window,
        headers: auth_header(token)

    assert_response :ok
    assert_includes %w[live derived empty degraded], parsed_json.dig("data", "sections", "queue", "status")
    assert_includes %w[live derived empty degraded], parsed_json.dig("data", "sections", "workers", "status")
    assert_equal "derived", parsed_json.dig("data", "sections", "event_log", "status")
    event_log = parsed_json.dig("data", "sections", "event_log", "data")
    assert_kind_of Array, event_log
    assert event_log.any? { |entry| entry["job_id"] == "job_fixture_pending" && entry["type"] == "worker_metric" }
    assert_includes %w[healthy degraded unavailable], parsed_json.dig("data", "dependencies", "broker", "status")
    assert_equal 300, parsed_json.dig("data", "slo", "slo_target_seconds")
    assert parsed_json.dig("data", "slo").key?("stale")
  end

  test "dashboard event log is scoped to the operator organization" do
    token = login_as("operator@example.com", "StrongPass123!")
    WorkerProcessingMetric.create!(
      job: jobs(:external_failed_job),
      event_id: "event_beta_metric",
      status: "failed_terminal",
      retry_count: 0,
      moved_to_dlq: false,
      processing_latency_ms: 24,
      trace_id: "trace_fixture_external",
      processed_at: Time.zone.parse("2026-04-06 11:02:00")
    )

    get "/api/v1/analytics/dashboard",
        params: analytics_fixture_window,
        headers: auth_header(token)

    assert_response :ok
    event_log = parsed_json.dig("data", "sections", "event_log", "data")
    refute event_log.any? { |entry| entry["job_id"] == "job_fixture_external_failed" }
  end

  test "warehouse reads clickhouse aggregates when available" do
    token = login_as("admin@example.com", "StrongPass123!")
    fake_reader = Class.new do
      def available?
        true
      end

      def aggregates(window:, organization_id:)
        raise "unexpected org scope" unless organization_id.nil?

        {
          last_event_at: Time.zone.parse("2026-04-06 12:00:00"),
          p95_ms: 17,
          error_budget_percent: 99.5,
          aggregates: {
            jobs_total: 3,
            uploads_total: 3,
            records_total: 11,
            valid_records: 9,
            invalid_records: 2,
            by_status: { "completed" => 2, "failed" => 1 },
            by_source: { "upload" => 3 }
          }
        }
      end
    end.new

    with_clickhouse_reader(fake_reader) do
      get "/api/v1/analytics/warehouse",
          params: analytics_fixture_window,
          headers: auth_header(token)
    end

    assert_response :ok
    assert_equal "clickhouse", parsed_json.dig("data", "source")
    assert_nil parsed_json.dig("data", "fallback_reason")
    assert_equal "healthy", parsed_json.dig("data", "dependency_status", "clickhouse")
    assert_equal 11, parsed_json.dig("data", "aggregates", "records_total")
    assert_equal 9, parsed_json.dig("data", "aggregates", "valid_records")
    assert_equal 2, parsed_json.dig("data", "aggregates", "invalid_records")
  end

  test "warehouse falls back to postgres derived source with complete SLO metadata" do
    token = login_as("operator@example.com", "StrongPass123!")
    failing_reader = Class.new do
      def available?
        true
      end

      def aggregates(window:, organization_id:)
        raise Analytics::ClickhouseWarehouseReader::Unavailable, "clickhouse down"
      end
    end.new

    with_clickhouse_reader(failing_reader) do
      get "/api/v1/analytics/warehouse",
          params: analytics_fixture_window,
          headers: auth_header(token)
    end

    assert_response :ok
    assert_equal "postgres_derived", parsed_json.dig("data", "source")
    assert_equal "clickhouse_unavailable", parsed_json.dig("data", "fallback_reason")
    assert_equal "unavailable", parsed_json.dig("data", "dependency_status", "clickhouse")
    assert OperationalWarning.where(code: "clickhouse_warehouse_read_failed", status: "open").exists?
    assert_equal 300, parsed_json.dig("data", "slo_target_seconds")
    assert parsed_json.dig("data").key?("lag_seconds")
    assert parsed_json.dig("data").key?("p95_ms")
    assert parsed_json.dig("data").key?("error_budget_percent")
    assert parsed_json.dig("data", "aggregates").key?("records_total")
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
    idempotency_key = "public-link-key"

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
         headers: auth_header(token).merge("Idempotency-Key" => "public-link-ssrf-key"),
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

  def analytics_fixture_window
    { from: "2026-04-05T00:00:00Z", to: "2026-04-07T00:00:00Z", timezone: "UTC" }
  end

  def with_clickhouse_reader(reader)
    singleton = class << Analytics::ClickhouseWarehouseReader; self; end
    original = Analytics::ClickhouseWarehouseReader.method(:new)
    singleton.define_method(:new) { |*| reader }
    yield
  ensure
    singleton.define_method(:new) { |*args, **kwargs| original.call(*args, **kwargs) }
  end
end
