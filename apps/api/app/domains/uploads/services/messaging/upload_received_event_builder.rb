module Messaging
  class UploadReceivedEventBuilder < ApplicationService
    EVENT_NAME = "upload.received.v1".freeze
    PAYLOAD_VERSION = 1

    def initialize(upload:, job:, producer: "api")
      @upload = upload
      @job = job
      @producer = producer
    end

    def call
      {
        event_id: StreamGate::Id.generate("event"),
        event_name: EVENT_NAME,
        occurred_at: Time.current.iso8601,
        producer: producer,
        payload_version: PAYLOAD_VERSION,
        correlation_id: correlation_id,
        trace_id: job.trace_id,
        request_id: job.request_id,
        upload_id: upload.id,
        job_id: job.id,
        payload: {
          storage_key: upload.storage_key,
          checksum_sha256: upload.checksum_sha256,
          content_type: upload.content_type,
          byte_size: upload.byte_size
        }
      }
    end

    private

    attr_reader :upload, :job, :producer

    def correlation_id
      job.request_id.presence || job.trace_id
    end
  end
end
