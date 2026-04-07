require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "requires strong password on create" do
    user = User.new(
      email: "new-user@example.com",
      full_name: "New User",
      password: "weakpass",
      password_confirmation: "weakpass"
    )

    assert_not user.valid?
    assert_includes user.errors[:password], "must include upper, lower, number and symbol"
  end

  test "accepts strong password on create" do
    user = User.new(
      email: "strong-user@example.com",
      full_name: "Strong User",
      password: "StrongPass123!",
      password_confirmation: "StrongPass123!"
    )

    assert user.valid?
  end

  test "active_for_auth only when active" do
    assert users(:operator).active_for_auth?

    users(:operator).update!(status: :suspended)
    assert_not users(:operator).reload.active_for_auth?
  end
end
