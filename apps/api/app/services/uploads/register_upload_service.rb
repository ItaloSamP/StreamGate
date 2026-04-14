module Uploads
  class RegisterUploadService < ApplicationService
    Result = Struct.new(:upload, :job, keyword_init: true)

    def initialize(user:, filename:, content_type:, byte_size:, checksum_sha256:, storage_key:, metadata: {}, request_id: nil, trace_id: nil)
      @user = user
      @attributes = {
        filename: filename,
        content_type: content_type,
        byte_size: byte_size,
        checksum_sha256: checksum_sha256,
        storage_key: storage_key,
        metadata: metadata,
        request_id: request_id,
        trace_id: trace_id || StreamGate::Id.generate("trace")
      }
    end

    def call
      outbox_event = nil
      upload = nil
      job = nil

      ApplicationRecord.transaction do
        upload = user.uploads.create!(upload_attributes)
        job = upload.jobs.create!(job_attributes)

        event_payload = Messaging::UploadReceivedEventBuilder.call(upload: upload, job: job)
        outbox_event = OutboxEnqueueEventService.call(
          event_name: event_payload[:event_name],
          routing_key: Rails.application.config.x.broker_upload_received_routing_key,
          payload: event_payload,
          headers: {
            "x-event-name" => event_payload[:event_name],
            "x-payload-version" => event_payload[:payload_version]
          },
          trace_id: event_payload[:trace_id],
          request_id: event_payload[:request_id]
        )

        AuditEvent.create!(
          actor: user,
          auditable: upload,
          action: "upload.registered",
          request_id: upload.request_id || upload.trace_id,
          trace_id: upload.trace_id,
          occurred_at: Time.current,
          metadata: {
            upload_id: upload.id,
            job_id: job.id,
            filename: upload.filename,
            event_id: event_payload[:event_id],
            event_name: event_payload[:event_name],
            correlation_id: event_payload[:correlation_id]
          }
        )

        AnalyticsSyncJobSnapshotService.call(job: job)
      end

      OutboxDispatchEventService.call(event_id: outbox_event.id) if outbox_event.present?

      Result.new(upload: upload, job: job)
    end

    private

    attr_reader :user, :attributes

    def upload_attributes
      attributes.slice(:filename, :content_type, :byte_size, :checksum_sha256, :storage_key, :metadata, :request_id, :trace_id)
    end

    def job_attributes
      {
        requested_by: user,
        source_type: "upload",
        request_id: attributes[:request_id],
        trace_id: attributes[:trace_id]
      }
    end
  end
end
