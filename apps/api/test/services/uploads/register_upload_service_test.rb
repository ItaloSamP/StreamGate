require "test_helper"

module Uploads
  class RegisterUploadServiceTest < ActiveSupport::TestCase
    test "creates upload job and audit event with shared trace" do
      dispatched_result = Struct.new(:event, :dispatched, :error, keyword_init: true).new(
        event: nil,
        dispatched: true,
        error: nil
      )

      result = nil
      with_singleton_stub(OutboxDispatchEventService, :call, dispatched_result) do
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
      end

      assert_instance_of Upload, result.upload
      assert_instance_of Job, result.job
      assert_equal users(:operator), result.upload.user
      assert_equal result.upload, result.job.upload
      assert_equal "trace_service_test", result.upload.trace_id
      assert_equal "trace_service_test", result.job.trace_id
      assert_equal "upload.registered", result.upload.audit_events.last.action
      assert_equal 1, IntegrationOutboxEvent.where(trace_id: "trace_service_test", event_name: "upload.received.v1").count
      assert_equal 1, AnalyticsJobSnapshot.where(job_id: result.job.id, organization_id: users(:operator).organization_id).count
    end

    test "persists upload and keeps outbox pending when broker dispatch fails" do
      outbox_result = Struct.new(:event, :dispatched, :error, keyword_init: true).new(
        event: nil,
        dispatched: false,
        error: StandardError.new("broker unavailable")
      )

      with_singleton_stub(OutboxDispatchEventService, :call, outbox_result) do
        assert_difference [ "Upload.count", "Job.count", "AuditEvent.count", "IntegrationOutboxEvent.count", "AnalyticsJobSnapshot.count" ], +1 do
          result = RegisterUploadService.call(
            user: users(:operator),
            filename: "rollback-file.csv",
            content_type: "text/csv",
            byte_size: 4096,
            checksum_sha256: "d" * 64,
            storage_key: "uploads/rollback-file.csv",
            request_id: "req_service_test",
            trace_id: "trace_service_test"
          )

          outbox = IntegrationOutboxEvent.find_by!(event_name: "upload.received.v1", trace_id: result.job.trace_id)
          assert_equal "pending", outbox.status
        end
      end
    end

    private

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
end
