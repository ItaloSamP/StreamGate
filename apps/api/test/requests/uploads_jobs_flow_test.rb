require "test_helper"

class UploadsJobsFlowTest < ActionDispatch::IntegrationTest
  setup do
    @original_cache = Rails.cache
    Rails.cache = ActiveSupport::Cache.lookup_store(:memory_store)
    Rails.cache.clear

    @original_upload_verify = Rails.application.config.x.upload_verify_object_before_register
    @original_upload_endpoint = Rails.application.config.x.upload_storage_endpoint
  end

  teardown do
    Rails.cache.clear
    Rails.cache = @original_cache

    Rails.application.config.x.upload_verify_object_before_register = @original_upload_verify
    Rails.application.config.x.upload_storage_endpoint = @original_upload_endpoint
  end

  test "signed-url returns presigned payload for authenticated actor" do
    token = login_as("operator@example.com", "StrongPass123!")

    post "/api/v1/uploads/signed-url",
         params: {
           upload: {
             filename: "orders.csv",
             content_type: "text/csv",
             byte_size: 2048,
             checksum_sha256: "a" * 64
           }
         },
         headers: auth_header(token),
         as: :json

    assert_response :created
    assert_equal "PUT", parsed_json.dig("data", "method")
    assert parsed_json.dig("data", "upload_url").include?("X-Amz-Signature=")
    assert_equal "text/csv", parsed_json.dig("data", "required_headers", "Content-Type")
    assert_match(%r{\Auploads/}, parsed_json.dig("data", "storage_key"))
  end

  test "signed-url rejects non-allowed content_type" do
    token = login_as("operator@example.com", "StrongPass123!")

    post "/api/v1/uploads/signed-url",
         params: {
           upload: {
             filename: "orders.json",
             content_type: "application/json",
             byte_size: 200,
             checksum_sha256: "b" * 64
           }
         },
         headers: auth_header(token),
         as: :json

    assert_response :unprocessable_entity
    assert_equal "validation_failed", parsed_json.dig("error", "code")
  end

  test "create upload registers upload and job when storage validation is disabled" do
    token = login_as("operator@example.com", "StrongPass123!")
    Rails.application.config.x.upload_verify_object_before_register = false

    assert_difference "Upload.count", 1 do
      assert_difference "Job.count", 1 do
        post "/api/v1/uploads",
             params: {
               upload: {
                 filename: "new-orders.csv",
                 content_type: "text/csv",
                 byte_size: 2048,
                 checksum_sha256: "c" * 64,
                 storage_key: "uploads/user_fixture_operator/2026/04/07/new-orders.csv",
                 metadata: { source: "integration_test" }
               }
             },
             headers: auth_header(token),
             as: :json
      end
    end

    assert_response :created
    assert_equal "new-orders.csv", parsed_json.dig("data", "upload", "filename")
    assert_equal "pending", parsed_json.dig("data", "job", "status")
  end

  test "create upload is idempotent when storage_key and checksum match" do
    token = login_as("operator@example.com", "StrongPass123!")

    assert_no_difference "Upload.count" do
      assert_no_difference "Job.count" do
        post "/api/v1/uploads",
             params: {
               upload: {
                 filename: "orders.csv",
                 content_type: "text/csv",
                 byte_size: 1024,
                 checksum_sha256: "a" * 64,
                 storage_key: "uploads/orders.csv"
               }
             },
             headers: auth_header(token),
             as: :json
      end
    end

    assert_response :ok
    assert_equal true, parsed_json.dig("meta", "idempotent")
    assert_equal "upload_fixture_registered", parsed_json.dig("data", "upload", "id")
    assert_equal "job_fixture_pending", parsed_json.dig("data", "job", "id")
  end

  test "create upload returns conflict when storage_key already exists with different checksum" do
    token = login_as("operator@example.com", "StrongPass123!")

    post "/api/v1/uploads",
         params: {
           upload: {
             filename: "orders.csv",
             content_type: "text/csv",
             byte_size: 1024,
             checksum_sha256: "d" * 64,
             storage_key: "uploads/orders.csv"
           }
         },
         headers: auth_header(token),
         as: :json

    assert_response :conflict
    assert_equal "resource_conflict", parsed_json.dig("error", "code")
  end

  test "create upload returns dependency_unavailable when storage check fails" do
    token = login_as("operator@example.com", "StrongPass123!")
    Rails.application.config.x.upload_verify_object_before_register = true
    Rails.application.config.x.upload_storage_endpoint = "://invalid-uri"

    post "/api/v1/uploads",
         params: {
           upload: {
             filename: "new-orders.csv",
             content_type: "text/csv",
             byte_size: 2048,
             checksum_sha256: "c" * 64,
             storage_key: "uploads/user_fixture_operator/2026/04/07/new-orders.csv"
           }
         },
         headers: auth_header(token),
         as: :json

    assert_response :service_unavailable
    assert_equal "dependency_unavailable", parsed_json.dig("error", "code")
  end

  test "uploads index returns pagination and actor-scoped data" do
    token = login_as("operator@example.com", "StrongPass123!")

    get "/api/v1/uploads", params: { page: 1, per_page: 10 }, headers: auth_header(token)

    assert_response :ok
    assert_equal 1, parsed_json.dig("meta", "pagination", "total_count")
    assert_equal "upload_fixture_registered", parsed_json.dig("data", 0, "id")
  end

  test "jobs index returns pagination and actor-scoped data" do
    token = login_as("operator@example.com", "StrongPass123!")

    get "/api/v1/jobs", params: { page: 1, per_page: 10, status: "pending" }, headers: auth_header(token)

    assert_response :ok
    assert_equal 1, parsed_json.dig("meta", "pagination", "total_count")
    assert_equal "job_fixture_pending", parsed_json.dig("data", 0, "id")
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
end
