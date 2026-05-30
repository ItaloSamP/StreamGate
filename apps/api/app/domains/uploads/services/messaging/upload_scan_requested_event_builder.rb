module Messaging
  class UploadScanRequestedEventBuilder < ApplicationService
    EVENT_NAME = "upload.scan.requested.v1".freeze
    PAYLOAD_VERSION = 1

    def initialize(upload:, job:, scan:, producer: "api")
      @upload = upload
      @job = job
      @scan = scan
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
          scan_id: scan.id,
          storage_key: upload.storage_key,
          checksum_sha256: upload.checksum_sha256,
          content_type: upload.content_type,
          byte_size: upload.byte_size
        }
      }
    end

    private

    attr_reader :upload, :job, :scan, :producer

    def correlation_id
      job.request_id.presence || job.trace_id
    end
  end
end
