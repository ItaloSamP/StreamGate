require "test_helper"

class CommandCenterBackWorkerTest < ActionDispatch::IntegrationTest
  test "dashboard exposes expanded clickhouse backed command center sections" do
    token = login_as("admin@example.com", "StrongPass123!")
    fake_reader = Class.new do
      def available?
        true
      end

      def dashboard(window:, organization_id:)
        raise "unexpected org scope" unless organization_id.nil?

        {
          last_event_at: Time.zone.parse("2026-04-06 12:00:00"),
          p95_ms: 31,
          error_budget_percent: 99.1,
          throughput: { jobs_total: 3, uploads_total: 3, completed: 2, failed: 1, quarantined: 0 },
          queue: { processed: 3, retried: 1, moved_to_dlq: 0 },
          workers: { processed: 2, failed_terminal: 1, average_latency_ms: 31 },
          formats: [ { content_type: "text/csv", count: 2 }, { content_type: "application/x-ndjson", count: 1 } ],
          timeseries_24h: [ { label: "12h", records: 42, volume_gb: 0.1, jobs: 3, failed: 1 } ],
          status_distribution: [ { status: "completed", count: 2 }, { status: "failed", count: 1 } ],
          heatmap_7d: { days: %w[Seg Ter Qua Qui Sex Sab Dom], rows: [ { range: "00-03", values: [ 1, 0, 0, 0, 0, 0, 0 ] } ] },
          jobs_board: [ { id: "job_fixture_pending", upload_id: "upload_fixture_registered", status: "pending", trace_id: "trace_fixture_1" } ],
          queue_items: [ { position: 1, name: "orders.csv", job_id: "job_fixture_pending", eta: "~1m" } ],
          ingestion: { supported_formats: %w[CSV JSON NDJSON ZIP XLSX Parquet], enabled_formats: %w[CSV JSON NDJSON ZIP XLSX Parquet], pending_formats: [] },
          workers_live: [ { id: "worker-01", status: "active", current_job_id: "job_fixture_pending", progress: 25, active: true } ]
        }
      end
    end.new

    with_clickhouse_reader(fake_reader) do
      get "/api/v1/analytics/dashboard",
          params: analytics_fixture_window,
          headers: auth_header(token)
    end

    assert_response :ok
    assert_equal "clickhouse", parsed_json.dig("data", "source")
    assert_equal "live", parsed_json.dig("data", "sections", "timeseries_24h", "status")
    assert_equal "live", parsed_json.dig("data", "sections", "heatmap_7d", "status")
    assert_equal [], parsed_json.dig("data", "sections", "ingestion", "data", "pending_formats")
    assert_equal "healthy", parsed_json.dig("data", "dependencies", "warehouse", "status")
  end

  test "realtime tickets and polling events are scoped to the current operator organization" do
    token = login_as("operator@example.com", "StrongPass123!")
    external = RealtimeEvent.create!(
      event_type: "job.completed",
      organization_id: "org_fixture_beta",
      resource_type: "Job",
      resource_id: "job_fixture_external_failed",
      severity: "info",
      payload: { job_id: "job_fixture_external_failed" },
      occurred_at: Time.zone.parse("2026-04-06 12:00:00"),
      expires_at: 1.day.from_now,
      trace_id: "trace_external",
      request_id: "req_external"
    )
    mine = RealtimeEvent.create!(
      event_type: "job.completed",
      organization_id: "org_fixture_alpha",
      resource_type: "Job",
      resource_id: "job_fixture_pending",
      severity: "info",
      payload: { job_id: "job_fixture_pending", token: "secret" },
      occurred_at: Time.zone.parse("2026-04-06 12:01:00"),
      expires_at: 1.day.from_now,
      trace_id: "trace_fixture_1",
      request_id: "req_fixture_1"
    )

    post "/api/v1/realtime/tickets", headers: auth_header(token)
    assert_response :created
    assert_equal "org_fixture_alpha", parsed_json.dig("data", "organization_id")
    assert parsed_json.dig("data", "ticket").present?

    get "/api/v1/realtime/events", headers: auth_header(token)
    assert_response :ok
    ids = parsed_json.fetch("data").map { |event| event.fetch("id") }
    assert_includes ids, mine.id
    refute_includes ids, external.id
    refute_includes response.body, "secret"
  end

  test "dashboard exports and alert actions are idempotent audited backend operations" do
    token = login_as("admin@example.com", "StrongPass123!")
    warning = OperationalWarning.create!(
      job: jobs(:pending_job),
      upload: uploads(:registered_upload),
      code: "dashboard_warning",
      message: "Needs review",
      status: "open",
      severity: "warning",
      retry_count: 0,
      trace_id: "trace_fixture_1",
      request_id: "req_fixture_1"
    )

    post "/api/v1/analytics/dashboard/exports",
         params: { export: { kind: "snapshot", format: "json", preset: "last_24h" } },
         headers: auth_header(token).merge("Idempotency-Key" => "dashboard-export-1"),
         as: :json
    assert_response :created
    assert_equal "snapshot", parsed_json.dig("data", "kind")
    assert_equal "json", parsed_json.dig("data", "format")
    refute_includes response.body, "secret"

    post "/api/v1/alerts/#{warning.id}/review",
         params: { operation: { reason: "triaged during command center validation" } },
         headers: auth_header(token).merge("Idempotency-Key" => "alert-review-1"),
         as: :json
    assert_response :ok
    assert_equal "reviewed", parsed_json.dig("data", "status")

    post "/api/v1/alerts/#{warning.id}/dismiss",
         params: { operation: { reason: "known transient dependency during validation" } },
         headers: auth_header(token).merge("Idempotency-Key" => "alert-dismiss-1"),
         as: :json
    assert_response :ok
    assert_equal "dismissed", parsed_json.dig("data", "status")
    assert AuditEvent.where(auditable_type: "OperationalWarning", auditable_id: warning.id).exists?
  end

  test "admin connector profile creates a short lease without exposing secrets" do
    token = login_as("admin@example.com", "StrongPass123!")

    post "/api/v1/connectors/profiles",
         params: {
           connector_profile: {
             name: "finance-s3",
             kind: "s3",
             settings: { region: "us-east-1", bucket: "finance", endpoint: "https://s3.example.com" },
             secrets: { access_key_id: "AKIASECRET", secret_access_key: "top-secret" }
           }
         },
         headers: auth_header(token).merge("Idempotency-Key" => "connector-profile-1"),
         as: :json
    assert_response :created
    profile_id = parsed_json.dig("data", "id")
    refute_includes response.body, "top-secret"
    assert_equal "[masked]", parsed_json.dig("data", "settings", "bucket")

    post "/api/v1/connectors/profiles/#{profile_id}/ingestions",
         params: { ingestion: { object_key: "incoming/orders.ndjson", filename: "orders.ndjson", content_type: "application/x-ndjson" } },
         headers: auth_header(token).merge("Idempotency-Key" => "connector-ingestion-1"),
         as: :json
    assert_response :created
    assert_equal "connector", parsed_json.dig("data", "upload", "source_type")
    assert parsed_json.dig("data", "lease", "id").present?
    assert parsed_json.dig("data", "lease", "token").present?
    refute_includes response.body, "top-secret"
    refute_includes response.body, "incoming/orders.ndjson"
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
