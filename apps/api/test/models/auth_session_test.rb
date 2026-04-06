require "test_helper"

class AuthSessionTest < ActiveSupport::TestCase
  test "active scope excludes revoked and expired sessions" do
    user = users(:operator)

    active = AuthSession.create!(
      user: user,
      token_digest: "tok_active",
      expires_at: 1.hour.from_now,
      trace_id: "trace_active"
    )

    expired = AuthSession.create!(
      user: user,
      token_digest: "tok_expired",
      created_at: 2.hours.ago,
      updated_at: 2.hours.ago,
      expires_at: 1.hour.ago,
      trace_id: "trace_expired"
    )

    revoked = AuthSession.create!(
      user: user,
      token_digest: "tok_revoked",
      expires_at: 1.hour.from_now,
      trace_id: "trace_revoked",
      revoked_at: Time.current
    )

    active_ids = AuthSession.active.pluck(:id)

    assert_includes active_ids, active.id
    assert_not_includes active_ids, expired.id
    assert_not_includes active_ids, revoked.id
  end
end
