require "test_helper"

class AuthSeedFixtureTest < ActiveSupport::TestCase
  test "auth user fixtures keep reproducible password and active status" do
    operator = users(:operator)

    assert operator.active_for_auth?
    assert operator.authenticate("StrongPass123!")
  end

  test "auth session fixtures preserve active and revoked semantics" do
    active_session = auth_sessions(:operator_active_session)
    revoked_session = auth_sessions(:admin_revoked_session)

    assert active_session.active?
    assert_not revoked_session.active?
    assert revoked_session.revoked?
  end
end
