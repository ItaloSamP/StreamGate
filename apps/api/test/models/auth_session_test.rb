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

    AuthSession.create!(
      user: user,
      token_digest: "tok_expired",
      created_at: 2.hours.ago,
      updated_at: 2.hours.ago,
      expires_at: 1.hour.ago,
      trace_id: "trace_expired"
    )

    AuthSession.create!(
      user: user,
      token_digest: "tok_revoked",
      expires_at: 1.hour.from_now,
      trace_id: "trace_revoked",
      revoked_at: Time.current
    )

    assert_equal [active.id], AuthSession.active.pluck(:id)
  end
end

