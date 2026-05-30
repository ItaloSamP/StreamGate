require "test_helper"

class SaasPlatformTest < ActionDispatch::IntegrationTest
  setup do
    @original_cache = Rails.cache
    Rails.cache = ActiveSupport::Cache.lookup_store(:memory_store)
    Rails.cache.clear
  end

  teardown do
    Rails.cache.clear
    Rails.cache = @original_cache
  end

  test "admin manages organization, invites members, and operators are denied admin controls" do
    admin_token = login_as("admin@example.com", "StrongPass123!")
    operator_token = login_as("operator@example.com", "StrongPass123!")

    get "/api/v1/organization", headers: auth_header(admin_token)
    assert_response :ok
    assert_equal "org_fixture_alpha", parsed_json.dig("data", "organization", "id")
    assert parsed_json.dig("data", "members").any? { |member| member["role"] == "admin" }

    post "/api/v1/organization/invites",
         params: { invite: { email: "new-operator@example.com", role: "operator" } },
         headers: auth_header(operator_token),
         as: :json
    assert_response :forbidden

    post "/api/v1/organization/invites",
         params: { invite: { email: "new-operator@example.com", role: "operator" } },
         headers: auth_header(admin_token),
         as: :json
    assert_response :created
    invite_token = parsed_json.dig("data", "debug_invite_token")
    assert invite_token.present?
    refute_includes response.body, "token_digest"

    post "/api/v1/organization/invites/#{invite_token}/accept",
         params: {
           acceptance: {
             full_name: "New Operator",
             password: "StrongPass123!",
             password_confirmation: "StrongPass123!"
           }
         },
         as: :json
    assert_response :created
    assert_equal "new-operator@example.com", parsed_json.dig("data", "user", "email")
    assert_equal "operator", parsed_json.dig("data", "membership", "role")
  end

  test "admin reads stay scoped to current organization" do
    admin_token = login_as("admin@example.com", "StrongPass123!")

    get "/api/v1/uploads", headers: auth_header(admin_token)
    assert_response :ok
    upload_ids = parsed_json.fetch("data").map { |upload| upload.fetch("id") }
    assert_includes upload_ids, "upload_fixture_registered"
    refute_includes upload_ids, "upload_fixture_external"

    get "/api/v1/jobs", headers: auth_header(admin_token)
    assert_response :ok
    job_ids = parsed_json.fetch("data").map { |job| job.fetch("id") }
    assert_includes job_ids, "job_fixture_pending"
    refute_includes job_ids, "job_fixture_external_failed"
  end

  test "MFA setup forces login challenge and verify issues the session token" do
    admin = users(:admin)
    admin_token = login_as("admin@example.com", "StrongPass123!")

    post "/api/v1/auth/mfa/setup", headers: auth_header(admin_token), as: :json
    assert_response :created
    secret = parsed_json.dig("data", "secret")
    assert secret.present?

    code = Auth::TotpService.code_for(secret, at: Time.current)
    post "/api/v1/auth/mfa/verify",
         params: { mfa: { code: code } },
         headers: auth_header(admin_token),
         as: :json
    assert_response :ok
    recovery_codes = parsed_json.dig("data", "recovery_codes")
    assert_equal 8, recovery_codes.length
    refute_includes response.body, "secret_ciphertext"

    post "/api/v1/auth/logout", headers: auth_header(admin_token)
    assert_response :ok

    post "/api/v1/auth/login",
         params: { session: { email: admin.email, password: "StrongPass123!" } },
         as: :json
    assert_response :accepted
    challenge_token = parsed_json.dig("data", "mfa", "challenge_token")
    assert challenge_token.present?
    assert_nil parsed_json.dig("data", "session", "access_token")

    code = Auth::TotpService.code_for(secret, at: Time.current)
    post "/api/v1/auth/mfa/verify",
         params: { mfa: { challenge_token: challenge_token, code: code } },
         as: :json
    assert_response :ok
    assert_equal admin.id, parsed_json.dig("data", "user", "id")
    assert parsed_json.dig("data", "session", "access_token").present?
  end

  test "OIDC Google Workspace flow stores secrets server-side and links verified users" do
    admin_token = login_as("admin@example.com", "StrongPass123!")

    patch "/api/v1/auth/oidc/config",
          params: {
            oidc_provider: {
              issuer: "https://accounts.google.com",
              client_id: "google-client-id",
              client_credential: "google-client-credential",
              hosted_domain: "example.com"
            }
          },
          headers: auth_header(admin_token),
          as: :json
    assert_response :ok
    refute_includes response.body, "google-client-credential"

    get "/api/v1/auth/oidc/google/start",
        params: { organization_id: "org_fixture_alpha" }
    assert_response :ok
    state = parsed_json.dig("data", "state")
    assert state.present?

    claims = {
      "iss" => "https://accounts.google.com",
      "aud" => "google-client-id",
      "email" => "operator@example.com",
      "email_verified" => true,
      "hd" => "example.com",
      "exp" => 10.minutes.from_now.to_i,
      "nonce" => parsed_json.dig("data", "nonce")
    }
    with_singleton_stub(Auth::Oidc::GoogleClient, :exchange_code, claims) do
      get "/api/v1/auth/oidc/google/callback",
          params: { state: state, code: "google-auth-code" }
    end

    assert_response :ok
    assert_equal "operator@example.com", parsed_json.dig("data", "user", "email")
    assert parsed_json.dig("data", "session", "access_token").present?
    refute_includes response.body, "refresh_token"
  end

  test "organization quotas block oversize upload registration before signed urls circulate" do
    admin = users(:admin)
    Organization.find(admin.organization_id).update!(
      quotas: {
        "max_file_bytes" => 100,
        "monthly_upload_bytes" => 1_000,
        "connector_runs_daily" => 10,
        "retention_days" => 30
      }
    )
    token = login_as("admin@example.com", "StrongPass123!")

    post "/api/v1/uploads/signed-url",
         params: {
           upload: {
             filename: "too-large.csv",
             content_type: "text/csv",
             byte_size: 101,
             checksum_sha256: "a" * 64
           }
         },
         headers: auth_header(token),
         as: :json

    assert_response :too_many_requests
    assert_equal "quota_exceeded", parsed_json.dig("error", "code")
    refute_includes response.body, "upload_url"
  end

  test "direct uploads publish malware scan request instead of parse-ready event" do
    token = login_as("admin@example.com", "StrongPass123!")
    original_verify = Rails.application.config.x.upload_verify_object_before_register
    Rails.application.config.x.upload_verify_object_before_register = false

    assert_difference [ "Upload.count", "Job.count", "MalwareScan.count", "IntegrationOutboxEvent.count" ], +1 do
      post "/api/v1/uploads",
           params: {
             upload: {
               filename: "orders.csv",
               content_type: "text/csv",
               byte_size: 128,
               checksum_sha256: "b" * 64,
               storage_key: "uploads/admin/orders.csv"
             }
           },
           headers: auth_header(token),
           as: :json
    end

    assert_response :created
    assert_equal "registered", parsed_json.dig("data", "upload", "status")
    scan = MalwareScan.order(:created_at).last
    assert_equal "pending", scan.status
    assert_equal parsed_json.dig("data", "upload", "id"), scan.upload_id
    assert_equal "upload.scan.requested.v1", IntegrationOutboxEvent.order(:created_at).last.event_name
    refute IntegrationOutboxEvent.where(event_name: "upload.received.v1", trace_id: parsed_json.dig("data", "job", "trace_id")).exists?
  ensure
    Rails.application.config.x.upload_verify_object_before_register = original_verify
  end

  test "Google Drive connector OAuth, item listing, and revoke never expose delegated tokens" do
    admin_token = login_as("admin@example.com", "StrongPass123!")

    get "/api/v1/connectors/google-drive/authorize", headers: auth_header(admin_token)
    assert_response :ok
    state = parsed_json.dig("data", "state")
    assert parsed_json.dig("data", "authorization_url").include?("https://accounts.google.com")

    with_singleton_stub(Connectors::GoogleDrive::OauthClient, :exchange_code, {
      "refresh_token" => "google-refresh-secret",
      "access_token" => "google-access-secret",
      "expires_in" => 3600,
      "scope" => "openid email profile https://www.googleapis.com/auth/drive"
    }) do
      get "/api/v1/connectors/google-drive/callback",
          params: { state: state, code: "drive-auth-code" },
          headers: auth_header(admin_token)
    end
    assert_response :ok
    refute_includes response.body, "google-refresh-secret"
    refute_includes response.body, "google-access-secret"

    with_singleton_stub(Connectors::GoogleDrive::Client, :list_items, [
      { id: "drive_file_1", name: "orders.csv", mime_type: "text/csv", kind: "file" },
      { id: "drive_folder_1", name: "Finance", mime_type: "application/vnd.google-apps.folder", kind: "folder" }
    ]) do
      get "/api/v1/connectors/google-drive/items", headers: auth_header(admin_token)
    end
    assert_response :ok
    assert_equal [ "orders.csv", "Finance" ], parsed_json.fetch("data").map { |item| item.fetch("name") }
    refute_includes response.body, "refresh_token"

    delete "/api/v1/connectors/google-drive/revoke", headers: auth_header(admin_token)
    assert_response :ok
    assert_equal "revoked", parsed_json.dig("data", "status")
  end

  private

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

  def with_singleton_stub(klass, method_name, return_value)
    singleton = klass.singleton_class
    original = klass.method(method_name)

    singleton.define_method(method_name) do |*_, **_|
      return_value
    end

    yield
  ensure
    singleton.define_method(method_name, original)
  end
end
