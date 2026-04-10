require "test_helper"

module Uploads
  class GenerateSignedUrlServiceTest < ActiveSupport::TestCase
    test "builds storage key and returns signed url payload" do
      captured = {}

      fake_client = Object.new
      fake_client.define_singleton_method(:presigned_put_for_upload) do |storage_key:, content_type:, checksum_sha256:, expires_in:|
        captured[:storage_key] = storage_key
        captured[:content_type] = content_type
        captured[:checksum_sha256] = checksum_sha256
        captured[:expires_in] = expires_in

        StorageClient::PresignedUrlResult.new(
          upload_url: "http://localhost:9000/signed",
          required_headers: { "Content-Type" => "text/csv" },
          expires_at: Time.current + 15.minutes
        )
      end

      result = GenerateSignedUrlService.call(
        user: users(:operator),
        filename: "orders.csv",
        content_type: "text/csv",
        byte_size: 2048,
        checksum_sha256: "b" * 64,
        storage_client: fake_client
      )

      assert result.success?
      assert captured[:storage_key].start_with?("uploads/user_fixture_operator/")
      assert_equal "text/csv", captured[:content_type]
      assert_equal "b" * 64, captured[:checksum_sha256]
      assert_equal Rails.application.config.x.upload_signed_url_ttl_seconds, captured[:expires_in]
      assert_equal "http://localhost:9000/signed", result.upload_url
    end
  end
end
