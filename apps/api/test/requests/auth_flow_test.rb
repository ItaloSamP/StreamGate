require "test_helper"

class AuthFlowTest < ActionDispatch::IntegrationTest
  setup do
    @original_cache = Rails.cache
    Rails.cache = ActiveSupport::Cache.lookup_store(:memory_store)
    Rails.cache.clear
  end

  teardown do
    Rails.cache.clear
    Rails.cache = @original_cache
  end

  test "register creates active user and session token" do
    post "/api/v1/auth/register",
         params: {
           registration: {
             full_name: "Auth User",
             email: "auth-user@example.com",
             password: "StrongPass123!",
             password_confirmation: "StrongPass123!"
           }
         },
         as: :json

    assert_response :created

    body = parsed_json
    assert_equal "auth-user@example.com", body.dig("data", "user", "email")
    assert_equal "active", body.dig("data", "user", "status")
    assert_equal "Bearer", body.dig("data", "session", "token_type")
    assert body.dig("data", "session", "access_token").present?
  end

  test "login returns invalid credentials for wrong password" do
    user = create_auth_user(email: "login-invalid@example.com", password: "StrongPass123!")

    post "/api/v1/auth/login",
         params: { session: { email: user.email, password: "WrongPass123!" } },
         as: :json

    assert_response :unauthorized
    assert_equal "invalid_credentials", parsed_json.dig("error", "code")
  end

  test "login returns rate_limited after repeated failures from same ip" do
    original_ip_limit = Rails.application.config.x.auth_login_limit_per_ip
    original_window = Rails.application.config.x.auth_throttle_window_seconds

    Rails.application.config.x.auth_login_limit_per_ip = 2
    Rails.application.config.x.auth_throttle_window_seconds = 60

    begin
      create_auth_user(email: "rate-limit@example.com", password: "StrongPass123!")

      2.times do
        post "/api/v1/auth/login",
             params: { session: { email: "rate-limit@example.com", password: "WrongPass123!" } },
             as: :json

        assert_response :unauthorized
      end

      post "/api/v1/auth/login",
           params: { session: { email: "rate-limit@example.com", password: "WrongPass123!" } },
           as: :json

      assert_response :too_many_requests
      assert_equal "rate_limited", parsed_json.dig("error", "code")
    ensure
      Rails.application.config.x.auth_login_limit_per_ip = original_ip_limit
      Rails.application.config.x.auth_throttle_window_seconds = original_window
    end
  end

  test "me returns current user and session when token is valid" do
    user = create_auth_user(email: "me-valid@example.com", password: "StrongPass123!")
    login = login_as(user.email, "StrongPass123!")
    token = login.dig("data", "session", "access_token")

    get "/api/v1/auth/me", headers: auth_header(token)

    assert_response :ok
    assert_equal user.id, parsed_json.dig("data", "user", "id")
    assert parsed_json.dig("data", "session", "id").present?
  end

  test "logout revokes session and blocks me" do
    user = create_auth_user(email: "logout@example.com", password: "StrongPass123!")
    login = login_as(user.email, "StrongPass123!")
    token = login.dig("data", "session", "access_token")

    post "/api/v1/auth/logout", headers: auth_header(token)
    assert_response :ok

    get "/api/v1/auth/me", headers: auth_header(token)
    assert_response :forbidden
    assert_equal "access_denied", parsed_json.dig("error", "code")
  end

  test "refresh rotates session token" do
    user = create_auth_user(email: "refresh@example.com", password: "StrongPass123!")
    login = login_as(user.email, "StrongPass123!")
    old_token = login.dig("data", "session", "access_token")

    post "/api/v1/auth/session/refresh", headers: auth_header(old_token)
    assert_response :ok

    new_token = parsed_json.dig("data", "session", "access_token")
    assert new_token.present?
    assert_not_equal old_token, new_token

    get "/api/v1/auth/me", headers: auth_header(old_token)
    assert_response :forbidden

    get "/api/v1/auth/me", headers: auth_header(new_token)
    assert_response :ok
  end

  test "me returns session_expired when token session is expired" do
    user = create_auth_user(email: "expired@example.com", password: "StrongPass123!")
    login = login_as(user.email, "StrongPass123!")
    token = login.dig("data", "session", "access_token")

    session = AuthSession.find_by!(token_digest: Auth::TokenService.digest(token))
    session.update!(
      created_at: 2.hours.ago,
      expires_at: 1.hour.ago
    )

    get "/api/v1/auth/me", headers: auth_header(token)

    assert_response :unauthorized
    assert_equal "session_expired", parsed_json.dig("error", "code")
  end

  test "password reset request and confirm updates password" do
    user = create_auth_user(email: "reset@example.com", password: "StrongPass123!")

    post "/api/v1/auth/password/reset/request",
         params: { password_reset: { email: user.email } },
         as: :json

    assert_response :ok
    token = parsed_json.dig("data", "debug_reset_token")
    assert token.present?

    post "/api/v1/auth/password/reset/confirm",
         params: {
           password_reset_confirmation: {
             token: token,
             password: "NewStrongPass123!",
             password_confirmation: "NewStrongPass123!"
           }
         },
         as: :json

    assert_response :ok

    post "/api/v1/auth/login",
         params: { session: { email: user.email, password: "NewStrongPass123!" } },
         as: :json

    assert_response :ok
  end

  private

  def parsed_json
    JSON.parse(response.body)
  end

  def auth_header(token)
    { "Authorization" => "Bearer #{token}" }
  end

  def create_auth_user(email:, password:)
    User.create!(
      full_name: "Integration User",
      email: email,
      organization_id: "org_auth_test",
      role: :operator,
      status: :active,
      password: password,
      password_confirmation: password
    )
  end

  def login_as(email, password)
    post "/api/v1/auth/login",
         params: { session: { email: email, password: password } },
         as: :json

    assert_response :ok
    parsed_json
  end
end
