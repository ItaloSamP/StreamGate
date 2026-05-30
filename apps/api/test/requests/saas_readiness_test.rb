require "test_helper"

class SaasReadinessTest < ActionDispatch::IntegrationTest
  test "admin can inspect SaaS release readiness without secrets" do
    login = login_as(users(:admin).email, "StrongPass123!")
    token = login.dig("data", "session", "access_token")

    get "/api/v1/saas/readiness", headers: auth_header(token)

    assert_response :ok

    data = parsed_json.fetch("data")
    assert_equal "org_fixture_alpha", data.dig("organization", "id")
    assert_equal "admin", data.dig("access", "role")
    assert_equal true, data.dig("access", "admin")
    assert_operator data.dig("organization", "members", "active"), :>=, 1

    assert_equal "oidc", data.dig("identity", "sso", "protocol")
    assert_equal "google_workspace", data.dig("identity", "sso", "validated_provider")
    assert_equal false, data.dig("identity", "saml", "enabled")
    assert_equal "out_of_scope", data.dig("billing", "status")

    assert_includes data.dig("connectors", "supported"), "s3"
    assert_includes data.dig("connectors", "supported"), "http"
    assert_includes data.dig("connectors", "supported"), "google_drive"
    assert_includes data.dig("connectors", "supported"), "oauth_delegated"
    assert_equal false, data.dig("connectors", "clear_lease_credentials_circulate")

    assert_equal "aws_eks", data.dig("infrastructure", "runtime")
    assert_equal "open_source", data.dig("observability", "stack")
    assert_equal "soc2_type_i", data.dig("compliance", "target")
    assert_includes data.dig("external_blockers"), "aws_account"
    assert_includes data.dig("external_blockers"), "google_oauth_client"
    assert_no_sensitive_values(data)
  end

  test "operator cannot inspect SaaS admin readiness" do
    login = login_as(users(:operator).email, "StrongPass123!")
    token = login.dig("data", "session", "access_token")

    get "/api/v1/saas/readiness", headers: auth_header(token)

    assert_response :forbidden
    assert_equal "access_denied", parsed_json.dig("error", "code")
  end

  private

  def login_as(email, password)
    post "/api/v1/auth/login",
         params: { session: { email: email, password: password } },
         as: :json

    assert_response :ok
    parsed_json
  end

  def auth_header(token)
    { "Authorization" => "Bearer #{token}" }
  end

  def parsed_json
    JSON.parse(response.body)
  end

  def assert_no_sensitive_values(value)
    serialized = JSON.generate(value)
    refute_match(/refresh_token|client_secret|lease_token|x-worker-token|password|Bearer\s+[A-Za-z0-9._-]+/i, serialized)
  end
end
