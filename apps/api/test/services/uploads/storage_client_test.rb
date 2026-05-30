require "test_helper"

module Uploads
  class StorageClientTest < ActiveSupport::TestCase
    test "generates presigned put url with expected query signature" do
      client = StorageClient.new(
        endpoint: "http://localhost:9000",
        bucket: "streamgate-uploads",
        region: "us-east-1",
        access_key: "streamgate",
        secret_key: "streamgate123"
      )

      result = client.presigned_put_for_upload(
        storage_key: "uploads/user_fixture_operator/2026/04/07/orders.csv",
        content_type: "text/csv",
        checksum_sha256: "a" * 64,
        expires_in: 900
      )

      assert result.success?
      assert_includes result.upload_url, "X-Amz-Algorithm=AWS4-HMAC-SHA256"
      assert_includes result.upload_url, "X-Amz-Signature="
      assert_equal "text/csv", result.required_headers["Content-Type"]
      assert_equal "a" * 64, result.required_headers["x-amz-meta-checksum-sha256"]
    end
  end
end
