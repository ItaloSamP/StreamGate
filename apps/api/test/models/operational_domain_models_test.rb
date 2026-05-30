require "test_helper"

class OperationalDomainModelsTest < ActiveSupport::TestCase
  test "job artifact validates official artifact types and default retention" do
    artifact = JobArtifact.new(
      job: jobs(:pending_job),
      artifact_type: :quality_report,
      status: :available,
      storage_key: "artifacts/job_fixture_pending/quality-report.json",
      filename: "quality-report.json",
      content_type: "application/json",
      byte_size: 128,
      trace_id: "trace_fixture_1"
    )

    assert artifact.valid?
    artifact.validate
    assert artifact.expires_at.present?

    artifact.artifact_type = "unexpected"
    assert_not artifact.valid?
  end

  test "dlq replay request blocks self approval and invalid execution order" do
    replay = DlqReplayRequest.create!(
      message_id: "message-123",
      requested_by: users(:admin),
      reason: "Replay controlado.",
      payload: { event_id: "event_1", event_name: "upload.received.v1" },
      trace_id: "trace_fixture_1"
    )

    assert_raises(ArgumentError) { replay.approve!(actor: users(:admin), reason: "self") }
    assert_raises(ArgumentError) { replay.execute!(actor: users(:admin), reason: "early", outbox_event_id: "outbox_1") }
  end

  test "webhook delivery schedules retry and eventually fails" do
    setting = NotificationSetting.create!(
      user: users(:operator),
      webhook_enabled: true,
      webhook_url: "https://hooks.example.test/streamgate"
    )
    delivery = WebhookDelivery.create!(
      notification_setting: setting,
      channel: :webhook,
      event_name: "notification.webhook_test",
      payload: {},
      trace_id: "trace_fixture_1"
    )

    delivery.schedule_retry!(error: "timeout")
    assert_equal "pending", delivery.status
    assert_equal 1, delivery.attempts_count

    2.times { delivery.schedule_retry!(error: "timeout") }
    assert_equal "failed", delivery.status
  end

  test "named policies cover admin operator and replay self approval" do
    assert JobPolicy.new(users(:admin), jobs(:external_failed_job)).retry_job?
    assert_not JobPolicy.new(users(:operator), jobs(:external_failed_job)).retry_job?

    replay = DlqReplayRequest.create!(
      message_id: "message-456",
      requested_by: users(:admin),
      reason: "Replay controlado.",
      payload: { event_id: "event_2", event_name: "upload.received.v1" },
      trace_id: "trace_fixture_1"
    )
    external_admin = User.create!(
      email: "external-admin-policy@example.com",
      full_name: "External Admin Policy",
      password: "StrongPass123!",
      organization_id: "org_fixture_beta",
      role: :admin,
      status: :active
    )

    assert_not DlqReplayRequestPolicy.new(users(:admin), replay).approve_dlq_replay?
    assert_not DlqReplayRequestPolicy.new(external_admin, replay).approve_dlq_replay?
    assert_not DlqReplayRequestPolicy.new(external_admin, replay).execute_dlq_replay?
  end
end
