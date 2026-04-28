module Uploads
  class RegisterPublicLinkService < ApplicationService
    Result = Struct.new(:upload, :job, :acquisition, keyword_init: true)

    ZERO_CHECKSUM = "0" * 64

    def initialize(user:, url:, filename:, content_type:, byte_size:, request_id:, trace_id:)
      @user = user
      @url = url.to_s.strip
      @filename = filename.to_s.strip
      @content_type = content_type.to_s.strip.downcase
      @byte_size = byte_size.to_i
      @request_id = request_id
      @trace_id = trace_id || StreamGate::Id.generate("trace")
    end

    def call
      upload = nil
      job = nil
      acquisition = nil
      outbox_event = nil

      ApplicationRecord.transaction do
        upload = user.uploads.create!(
          filename: filename,
          content_type: content_type,
          byte_size: [ byte_size, 1 ].max,
          checksum_sha256: ZERO_CHECKSUM,
          storage_key: storage_key,
          source_type: "external_link",
          metadata: {
            link_mode: "public_link",
            url_masked: masked_url,
            url_hash: url_hash,
            source_host: source_host,
            acquisition_status: "pending"
          },
          request_id: request_id,
          trace_id: trace_id
        )

        job = upload.jobs.create!(
          requested_by: user,
          source_type: "external_link",
          request_id: request_id,
          trace_id: trace_id
        )

        acquisition = UploadAcquisition.create!(
          upload: upload,
          job: job,
          source_type: "external_link",
          link_mode: "public_link",
          status: "pending",
          url_hash: url_hash,
          url_masked: masked_url,
          source_host: source_host,
          content_type: content_type,
          byte_size: byte_size.positive? ? byte_size : nil,
          requested_at: Time.current,
          request_id: request_id,
          trace_id: trace_id
        )

        event_payload = Messaging::PublicLinkRequestedEventBuilder.call(
          upload: upload,
          job: job,
          acquisition: acquisition,
          source_url: url
        )
        outbox_event = OutboxEnqueueEventService.call(
          event_name: event_payload[:event_name],
          routing_key: Rails.application.config.x.broker_public_link_requested_routing_key,
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
          action: "upload.public_link.requested",
          request_id: request_id || trace_id,
          trace_id: trace_id,
          occurred_at: Time.current,
          metadata: {
            upload_id: upload.id,
            job_id: job.id,
            filename: upload.filename,
            source_type: "external_link",
            link_mode: "public_link",
            url_hash: url_hash,
            source_host: source_host,
            event_id: event_payload[:event_id],
            event_name: event_payload[:event_name],
            correlation_id: event_payload[:correlation_id]
          }
        )

        AnalyticsSyncJobSnapshotService.call(job: job)
      end

      OutboxDispatchEventService.call(event_id: outbox_event.id) if outbox_event.present?

      Result.new(upload: upload, job: job, acquisition: acquisition)
    end

    private

    attr_reader :user, :url, :filename, :content_type, :byte_size, :request_id, :trace_id

    def storage_key
      @storage_key ||= [
        "uploads",
        "external",
        user.id,
        Time.current.utc.strftime("%Y/%m/%d"),
        "#{StreamGate::Id.generate("plink")}-#{safe_filename}"
      ].join("/")
    end

    def safe_filename
      filename.gsub(/[^a-zA-Z0-9._-]/, "_").presence || "public-link.dat"
    end

    def masked_url
      @masked_url ||= PublicLinkUrlPolicy.mask(url)
    end

    def url_hash
      @url_hash ||= PublicLinkUrlPolicy.hash(url)
    end

    def source_host
      @source_host ||= URI.parse(url).host.to_s.downcase
    end
  end
end
