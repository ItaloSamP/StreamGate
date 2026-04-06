require "test_helper"

module Uploads
  class RegisterUploadServiceTest < ActiveSupport::TestCase
    test "creates upload job and audit event with shared trace" do
      result = RegisterUploadService.call(
        user: users(:operator),
        filename: "new-file.csv",
        content_type: "text/csv",
        byte_size: 4096,
        checksum_sha256: "c" * 64,
        storage_key: "uploads/new-file.csv",
        request_id: "req_service_test",
        trace_id: "trace_service_test"
      )

      assert_instance_of Upload, result.upload
      assert_instance_of Job, result.job
      assert_equal users(:operator), result.upload.user
      assert_equal result.upload, result.job.upload
      assert_equal "trace_service_test", result.upload.trace_id
      assert_equal "trace_service_test", result.job.trace_id
      assert_equal "upload.registered", result.upload.audit_events.last.action
    end
  end
end
