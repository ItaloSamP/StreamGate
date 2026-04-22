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

  test "retry rejects jobs outside the allowed status matrix" do
    token = login_as("admin@example.com", "StrongPass123!")

    post "/api/v1/jobs/#{jobs(:pending_job).id}/retry",
         params: { operation: { reason: "Nao deveria aceitar retry em job pendente." } },
         headers: auth_header(token).merge("Idempotency-Key" => "retry-invalid-state-1"),
         as: :json

    assert_response :unprocessable_entity
    assert_equal "invalid_state", parsed_json.dig("error", "code")
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

  test "resolve quarantine is admin-only and requires idempotency key" do
    record = quarantine_records(:warning_record)
    operator_token = login_as("operator@example.com", "StrongPass123!")
    admin_token = login_as("admin@example.com", "StrongPass123!")

    post "/api/v1/quarantine/#{record.id}/resolve",
         params: { operation: { reason: "Tentativa sem permissao." } },
         headers: auth_header(operator_token).merge("Idempotency-Key" => "resolve-denied-1"),
         as: :json

    assert_response :forbidden

    post "/api/v1/quarantine/#{record.id}/resolve",
         params: { operation: { reason: "Tentativa sem chave." } },
         headers: auth_header(admin_token),
         as: :json

    assert_response :unprocessable_entity
    assert_equal "idempotency_key_required", parsed_json.dig("error", "code")
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

  test "dlq replay request validates idempotency and payload contract" do
    token = login_as("admin@example.com", "StrongPass123!")

    post "/api/v1/quarantine/dlq/message-invalid/replay-requests",
         params: {
           operation: {
             reason: "Tentativa sem chave.",
             payload: dlq_payload
           }
         },
         headers: auth_header(token),
         as: :json

    assert_response :unprocessable_entity
    assert_equal "idempotency_key_required", parsed_json.dig("error", "code")

    post "/api/v1/quarantine/dlq/message-invalid/replay-requests",
         params: {
           operation: {
             reason: "Payload invalido.",
             payload: dlq_payload.except(:trace_id)
           }
         },
         headers: auth_header(token).merge("Idempotency-Key" => "replay-invalid-payload-1"),
         as: :json

    assert_response :unprocessable_entity
    assert_equal "invalid_payload", parsed_json.dig("error", "code")
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

  test "webhook test requires idempotency key and enabled webhook channel" do
    token = login_as("operator@example.com", "StrongPass123!")

    patch "/api/v1/notification-settings",
          params: {
            notification_setting: {
              in_app_enabled: true,
              email_enabled: false,
              webhook_enabled: false,
              webhook_url: nil
            }
          },
          headers: auth_header(token),
          as: :json
    assert_response :ok

    post "/api/v1/notification-settings/webhook/test",
         params: { operation: { reason: "Sem webhook habilitado." } },
         headers: auth_header(token).merge("Idempotency-Key" => "webhook-disabled-1"),
         as: :json
    assert_response :unprocessable_entity
    assert_equal "validation_failed", parsed_json.dig("error", "code")

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

    post "/api/v1/notification-settings/webhook/test",
         params: { operation: { reason: "Tentativa sem chave." } },
         headers: auth_header(token),
         as: :json

    assert_response :unprocessable_entity
    assert_equal "idempotency_key_required", parsed_json.dig("error", "code")
  end

  test "notifications can be read archived restored and deleted only by owner" do
    token = login_as("operator@example.com", "StrongPass123!")
    external_token = login_as("external@example.com", "StrongPass123!")
    notification = Notification.create!(
      recipient: users(:operator),
      event_name: "job.completed",
      title: "Job concluido",
      body: "O job terminou com artefatos disponiveis.",
      metadata: { job_id: jobs(:pending_job).id },
      trace_id: "trace_notification_fixture",
      request_id: "req_notification_fixture"
    )

    get "/api/v1/notifications", headers: auth_header(token)
    assert_response :ok
    assert_equal notification.id, parsed_json.dig("data", 0, "id")

    patch "/api/v1/notifications/#{notification.id}/read", headers: auth_header(external_token), as: :json
    assert_response :not_found

    patch "/api/v1/notifications/#{notification.id}/read", headers: auth_header(token), as: :json
    assert_response :ok
    assert_equal "read", parsed_json.dig("data", "status")
    assert parsed_json.dig("data", "read_at").present?

    patch "/api/v1/notifications/#{notification.id}/archive", headers: auth_header(token), as: :json
    assert_response :ok
    assert_equal "archived", parsed_json.dig("data", "status")

    get "/api/v1/notifications", headers: auth_header(token)
    assert_response :ok
    assert_empty parsed_json.fetch("data")

    get "/api/v1/notifications", params: { status: "archived" }, headers: auth_header(token)
    assert_response :ok
    assert_equal notification.id, parsed_json.dig("data", 0, "id")

    patch "/api/v1/notifications/#{notification.id}/unarchive", headers: auth_header(token), as: :json
    assert_response :ok
    assert_equal "read", parsed_json.dig("data", "status")

    delete "/api/v1/notifications/#{notification.id}", headers: auth_header(token), as: :json
    assert_response :ok
    assert_equal true, parsed_json.dig("data", "deleted")
    assert_not Notification.exists?(notification.id)
  end

  test "notification bulk actions are scoped to current actor" do
    token = login_as("operator@example.com", "StrongPass123!")
    mine = Notification.create!(
      recipient: users(:operator),
      event_name: "job.failed",
      title: "Job falhou",
      body: "Falha operacional.",
      trace_id: "trace_bulk_1"
    )
    other = Notification.create!(
      recipient: users(:external_operator),
      event_name: "job.failed",
      title: "Job externo",
      body: "Falha externa.",
      trace_id: "trace_bulk_2"
    )

    patch "/api/v1/notifications/mark-all-read", headers: auth_header(token), as: :json
    assert_response :ok
    assert_equal 1, parsed_json.dig("data", "updated_count")
    assert_equal "read", mine.reload.status
    assert_equal "unread", other.reload.status

    patch "/api/v1/notifications/bulk-archive",
          params: { notifications: { ids: [ mine.id, other.id ] } },
          headers: auth_header(token),
          as: :json
    assert_response :ok
    assert_equal 1, parsed_json.dig("data", "archived_count")
    assert_equal "archived", mine.reload.status
    assert_equal "unread", other.reload.status
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
