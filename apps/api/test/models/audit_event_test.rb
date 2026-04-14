require "test_helper"

class AuditEventTest < ActiveSupport::TestCase
  test "requires trace and request context" do
    event = AuditEvent.new(
      actor: users(:operator),
      auditable: uploads(:registered_upload),
      action: "upload.registered",
      occurred_at: Time.current
    )

    assert_not event.valid?
    assert_includes event.errors[:request_id], "can't be blank"
    assert_includes event.errors[:trace_id], "can't be blank"
  end

  test "sanitizes metadata with allowlist" do
    event = AuditEvent.create!(
      actor: users(:operator),
      auditable: uploads(:registered_upload),
      action: "upload.registered",
      request_id: "req_fixture_1",
      trace_id: "trace_fixture_1",
      occurred_at: Time.current,
      metadata: {
        "job_id" => "job_fixture_pending",
        "password" => "secret"
      }
    )

    assert_equal "job_fixture_pending", event.metadata["job_id"]
    assert_equal "[REDACTED]", event.metadata["password"]
  end
end
