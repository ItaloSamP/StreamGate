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
end
