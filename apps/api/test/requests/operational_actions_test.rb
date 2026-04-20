require "test_helper"

class OperationalActionsTest < ActionDispatch::IntegrationTest
  test "operator cannot retry a job" do
    token = login_as("operator@example.com", "StrongPass123!")

    post "/api/v1/jobs/#{jobs(:external_failed_job).id}/retry",
         params: { operation: { reason: "Reprocessar apos ajuste operacional." } },
         headers: auth_header(token).merge("Idempotency-Key" => "retry-denied-1"),
         as: :json

    assert_response :forbidden
  end

  test "admin retry requires idempotency key" do
    token = login_as("admin@example.com", "StrongPass123!")

    post "/api/v1/jobs/#{jobs(:external_failed_job).id}/retry",
         params: { operation: { reason: "Reprocessar apos ajuste operacional." } },
         headers: auth_header(token),
         as: :json

    assert_response :unprocessable_entity
    assert_equal "idempotency_key_required", parsed_json.dig("error", "code")
  end

  test "admin retry creates attempt audit and outbox event idempotently" do
    token = login_as("admin@example.com", "StrongPass123!")
    job = jobs(:external_failed_job)

    assert_difference "ProcessingAttempt.count", 1 do
      assert_difference "AuditEvent.where(action: 'job.retry_requested').count", 1 do
        assert_difference "IntegrationOutboxEvent.count", 1 do
          post "/api/v1/jobs/#{job.id}/retry",
               params: { operation: { reason: "Reprocessar apos ajuste operacional." } },
               headers: auth_header(token).merge("Idempotency-Key" => "retry-once-1"),
               as: :json
        end
      end
    end

    assert_response :accepted
    first_body = response.body
    assert_equal "retry_requested", parsed_json.dig("data", "status")

    assert_no_difference "ProcessingAttempt.count" do
      post "/api/v1/jobs/#{job.id}/retry",
           params: { operation: { reason: "Reprocessar apos ajuste operacional." } },
           headers: auth_header(token).merge("Idempotency-Key" => "retry-once-1"),
           as: :json
    end

    assert_response :accepted
    assert_equal JSON.parse(first_body), parsed_json
  end

  test "idempotency key cannot be reused with different payload" do
    token = login_as("admin@example.com", "StrongPass123!")
    job = jobs(:external_failed_job)

    post "/api/v1/jobs/#{job.id}/retry",
         params: { operation: { reason: "Primeiro motivo operacional." } },
         headers: auth_header(token).merge("Idempotency-Key" => "retry-conflict-1"),
         as: :json
    assert_response :accepted

    post "/api/v1/jobs/#{job.id}/retry",
         params: { operation: { reason: "Segundo motivo divergente." } },
         headers: auth_header(token).merge("Idempotency-Key" => "retry-conflict-1"),
         as: :json

    assert_response :conflict
    assert_equal "idempotency_key_conflict", parsed_json.dig("error", "code")
  end

  test "resolve quarantine marks record once and audits" do
    token = login_as("admin@example.com", "StrongPass123!")
    record = quarantine_records(:warning_record)

    assert_difference "AuditEvent.where(action: 'quarantine.resolve').count", 1 do
      post "/api/v1/quarantine/#{record.id}/resolve",
           params: { operation: { reason: "Linha revisada manualmente." } },
           headers: auth_header(token).merge("Idempotency-Key" => "resolve-once-1"),
           as: :json
    end

    assert_response :ok
    assert_equal "resolved", parsed_json.dig("data", "resolution_status")
    assert_equal "Linha revisada manualmente.", record.reload.resolution_reason

    post "/api/v1/quarantine/#{record.id}/resolve",
         params: { operation: { reason: "Tentativa duplicada." } },
         headers: auth_header(token).merge("Idempotency-Key" => "resolve-second-1"),
         as: :json

    assert_response :unprocessable_entity
    assert_equal "invalid_state", parsed_json.dig("error", "code")
  end

  test "dlq replay request approval and execution require separate admin" do
    creator_token = login_as("admin@example.com", "StrongPass123!")
    approver = User.create!(
      email: "second-admin@example.com",
      full_name: "Second Admin",
      password: "StrongPass123!",
      organization_id: "org_fixture_alpha",
      role: :admin,
      status: :active
    )
    approver_token = login_as(approver.email, "StrongPass123!")

    assert_difference "DlqReplayRequest.count", 1 do
      post "/api/v1/quarantine/dlq/message-123/replay-requests",
           params: {
             operation: {
               reason: "Replay controlado apos inspecao.",
               payload: dlq_payload
             }
           },
           headers: auth_header(creator_token).merge("Idempotency-Key" => "replay-request-1"),
           as: :json
    end
    assert_response :created
    request_id = parsed_json.dig("data", "id")

    post "/api/v1/dlq-replay-requests/#{request_id}/approve",
         params: { operation: { reason: "Tentativa de auto-aprovacao." } },
         headers: auth_header(creator_token).merge("Idempotency-Key" => "replay-approve-self-1"),
         as: :json
    assert_response :forbidden

    post "/api/v1/dlq-replay-requests/#{request_id}/execute",
         params: { operation: { reason: "Executar antes da aprovacao." } },
         headers: auth_header(creator_token).merge("Idempotency-Key" => "replay-execute-early-1"),
         as: :json
    assert_response :unprocessable_entity

    post "/api/v1/dlq-replay-requests/#{request_id}/approve",
         params: { operation: { reason: "Aprovado por segundo admin." } },
         headers: auth_header(approver_token).merge("Idempotency-Key" => "replay-approve-1"),
         as: :json
    assert_response :ok
    assert_equal "approved", parsed_json.dig("data", "status")

    assert_difference "IntegrationOutboxEvent.count", 1 do
      post "/api/v1/dlq-replay-requests/#{request_id}/execute",
           params: { operation: { reason: "Executar replay aprovado." } },
           headers: auth_header(creator_token).merge("Idempotency-Key" => "replay-execute-1"),
           as: :json
    end
    assert_response :accepted
    assert_equal "executed", parsed_json.dig("data", "status")
  end

  test "artifact list and download url are scoped and audited" do
    token = login_as("operator@example.com", "StrongPass123!")
    external_token = login_as("external@example.com", "StrongPass123!")
    artifact = JobArtifact.create!(
      job: jobs(:pending_job),
      artifact_type: :quality_report,
      status: :available,
      storage_key: "artifacts/job_fixture_pending/quality-report.json",
      filename: "quality-report.json",
      content_type: "application/json",
      byte_size: 512,
      checksum_sha256: "f" * 64,
      trace_id: "trace_fixture_1",
      request_id: "req_fixture_1"
    )

    get "/api/v1/jobs/#{jobs(:pending_job).id}/artifacts", headers: auth_header(token)
    assert_response :ok
    assert_equal artifact.id, parsed_json.dig("data", 0, "id")

    post "/api/v1/jobs/#{jobs(:pending_job).id}/artifacts/#{artifact.id}/download-url",
         headers: auth_header(external_token),
         as: :json
    assert_response :forbidden

    assert_difference "AuditEvent.where(action: 'artifact.download_url_created').count", 1 do
      post "/api/v1/jobs/#{jobs(:pending_job).id}/artifacts/#{artifact.id}/download-url",
           headers: auth_header(token),
           as: :json
    end
    assert_response :ok
    assert_includes parsed_json.dig("data", "download_url"), "X-Amz-Signature="
    assert parsed_json.dig("data", "expires_at").present?
  end

  test "notification settings and webhook test create pending delivery" do
    token = login_as("operator@example.com", "StrongPass123!")

    patch "/api/v1/notification-settings",
          params: {
            notification_setting: {
              in_app_enabled: true,
              email_enabled: true,
              webhook_enabled: true,
              webhook_url: "https://hooks.example.test/streamgate"
            }
          },
          headers: auth_header(token),
          as: :json

    assert_response :ok
    assert_equal true, parsed_json.dig("data", "webhook_enabled")
    assert_nil parsed_json.dig("data", "webhook_secret")

    assert_difference "WebhookDelivery.count", 1 do
      post "/api/v1/notification-settings/webhook/test",
           params: { operation: { reason: "Validar canal de webhook." } },
           headers: auth_header(token).merge("Idempotency-Key" => "webhook-test-1"),
           as: :json
    end

    assert_response :accepted
    assert_equal "pending", parsed_json.dig("data", "status")
    assert_nil parsed_json.dig("data", "webhook_secret")
  end

  private

  def dlq_payload
    {
      event_id: "event_fixture_replay",
      event_name: "upload.received.v1",
      occurred_at: Time.current.iso8601,
      producer: "worker",
      payload_version: 1,
      correlation_id: "req_fixture_1",
      trace_id: "trace_fixture_1",
      request_id: "req_fixture_1",
      upload_id: "upload_fixture_registered",
      job_id: "job_fixture_pending",
      payload: {
        storage_key: "uploads/orders.csv",
        checksum_sha256: "a" * 64,
        content_type: "text/csv",
        byte_size: 1024
      }
    }
  end

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
