require "test_helper"

class OperationalReadsTest < ActionDispatch::IntegrationTest
  test "analytics returns kpis and breakdowns scoped to actor organization" do
    token = login_as("operator@example.com", "StrongPass123!")

    get "/api/v1/analytics",
        params: {
          from: "2026-04-01T00:00:00",
          to: "2026-04-30T23:59:59",
          timezone: "UTC",
          sort_by: "count",
          sort_order: "desc",
          page: 1,
          per_page: 10
        },
        headers: auth_header(token)

    assert_response :ok
    assert_equal 2, parsed_json.dig("data", "kpis", "jobs_total")
    assert_equal 1, parsed_json.dig("data", "kpis", "jobs_completed")
    assert_equal 0, parsed_json.dig("data", "kpis", "jobs_failed")
    assert_kind_of Array, parsed_json.dig("data", "breakdowns", "status")
    assert_kind_of Array, parsed_json.dig("data", "breakdowns", "actor")
    assert_kind_of Array, parsed_json.dig("data", "breakdowns", "source")
  end

  test "quarantine index enforces organization scope and supports filters" do
    token = login_as("operator@example.com", "StrongPass123!")
    quarantine_records(:warning_record).update!(payload: { cpf: "12345678900", row_number: 3 })

    get "/api/v1/quarantine",
        params: { severity: "warning", preset: "last_30d", sort_by: "created_at", sort_order: "desc" },
        headers: auth_header(token)

    assert_response :ok
    assert_equal "warning", parsed_json.dig("meta", "filters", "severity")
    ids = parsed_json.fetch("data").map { |entry| entry.fetch("id") }
    assert_includes ids, "quarantine_fixture_warning"
    assert_includes ids, "quarantine_fixture_peer_warning"
    warning = parsed_json.fetch("data").find { |entry| entry.fetch("id") == "quarantine_fixture_warning" }
    assert_equal "[REDACTED]", warning.dig("payload", "cpf")
    assert_equal 3, warning.dig("payload", "row_number")
  end

  test "audit index is admin-only and enforces retention metadata" do
    operator_token = login_as("operator@example.com", "StrongPass123!")

    get "/api/v1/audit", params: { preset: "last_7d" }, headers: auth_header(operator_token)
    assert_response :forbidden

    admin_token = login_as("admin@example.com", "StrongPass123!")
    get "/api/v1/audit", params: { preset: "last_7d", sort_by: "occurred_at", sort_order: "desc" }, headers: auth_header(admin_token)
    assert_response :ok
    assert_kind_of Array, parsed_json["data"]
    assert_equal 180, parsed_json.dig("meta", "filters", "retention_days")
  end

  test "dlq inspection is admin-only and returns broker payload snapshot" do
    sample = Messaging::DlqInspector::Result.new(
      queue_depth: 3,
      messages: [
        {
          payload: { "event_id" => "event_fixture_dlq", "event_name" => "upload.received", "job_id" => "job_fixture_pending", "trace_id" => "trace_fixture_1", "cpf" => "12345678900" },
          exchange: "streamgate.events",
          routing_key: "upload.received.v1.dlq",
          redelivered: true,
          retry_count: 3,
          dead_letter_reason: "max_retries_exceeded",
          headers: {}
        }
      ]
    )

    operator_token = login_as("operator@example.com", "StrongPass123!")
    get "/api/v1/quarantine/dlq", headers: auth_header(operator_token)
    assert_response :forbidden

    admin_token = login_as("admin@example.com", "StrongPass123!")
    with_singleton_stub(Messaging::DlqInspector, :call, sample) do
      get "/api/v1/quarantine/dlq", params: { sort_by: "retry_count", sort_order: "desc", dead_letter_reason: "max_retries_exceeded" }, headers: auth_header(admin_token)
    end

    assert_response :ok
    assert_equal 3, parsed_json.dig("meta", "queue", "queue_depth")
    assert_equal "event_fixture_dlq", parsed_json.dig("data", 0, "payload", "event_id")
    assert_equal "[REDACTED]", parsed_json.dig("data", 0, "payload", "cpf")
  end

  test "operational endpoints validate invalid sort and preset filters" do
    token = login_as("admin@example.com", "StrongPass123!")

    get "/api/v1/audit", params: { preset: "invalid_range" }, headers: auth_header(token)
    assert_response :unprocessable_entity
    assert_equal "validation_failed", parsed_json.dig("error", "code")

    get "/api/v1/quarantine", params: { sort_by: "nonexistent" }, headers: auth_header(token)
    assert_response :unprocessable_entity
    assert_equal "validation_failed", parsed_json.dig("error", "code")

    get "/api/v1/quarantine/dlq", params: { page: 2 }, headers: auth_header(token)
    assert_response :unprocessable_entity
    assert_equal "validation_failed", parsed_json.dig("error", "code")
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

  def with_singleton_stub(klass, method_name, return_value)
    singleton = klass.singleton_class
    original = klass.method(method_name)

    singleton.define_method(method_name) do |*_, **_|
      return_value
    end

    yield
  ensure
    singleton.define_method(method_name, original)
  end
end
