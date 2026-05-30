module Messaging
  class PublicLinkRequestedEventBuilder < ApplicationService
    EVENT_NAME = "upload.public_link.requested.v1".freeze
    PAYLOAD_VERSION = 1

    def initialize(upload:, job:, acquisition:, source_url:, producer: "api")
      @upload = upload
      @job = job
      @acquisition = acquisition
      @source_url = source_url
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
          acquisition_id: acquisition.id,
          source_url: source_url,
          url_hash: acquisition.url_hash,
          url_masked: acquisition.url_masked,
          source_host: acquisition.source_host,
          storage_key: upload.storage_key,
          filename: upload.filename,
          content_type: upload.content_type,
          declared_byte_size: upload.byte_size
        }
      }
    end

    private

    attr_reader :upload, :job, :acquisition, :source_url, :producer

    def correlation_id
      job.request_id.presence || job.trace_id
    end
  end
end
