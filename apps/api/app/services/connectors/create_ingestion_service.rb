require "digest"

module Connectors
  class CreateIngestionService < ApplicationService
    Result = Struct.new(:upload, :job, :ingestion, :lease, :lease_token, keyword_init: true)

    ZERO_CHECKSUM = "0" * 64

    def initialize(actor:, profile:, filename:, content_type:, object_key: nil, source_path: nil, request_id:, trace_id:)
      @actor = actor
      @profile = profile
      @filename = filename.to_s.strip
      @content_type = content_type.to_s.strip.downcase
      @object_key = object_key.to_s.strip.presence
      @source_path = source_path.to_s.strip.presence
      @request_id = request_id
      @trace_id = trace_id
    end

    def call
      validate_source!
      upload = nil
      job = nil
      ingestion = nil
      lease = nil
      lease_token = nil
      outbox = nil

      ApplicationRecord.transaction do
        upload = actor.uploads.create!(
          filename: filename,
          content_type: content_type,
          byte_size: 1,
          checksum_sha256: ZERO_CHECKSUM,
          storage_key: storage_key,
          source_type: "connector",
          metadata: {
            connector_profile_id: profile.id,
            connector_kind: profile.kind,
            source_path_hash: Digest::SHA256.hexdigest((object_key || source_path).to_s)
          },
          request_id: request_id,
          trace_id: trace_id
        )
        job = upload.jobs.create!(
          requested_by: actor,
          source_type: "connector",
          request_id: request_id,
          trace_id: trace_id
        )
        ingestion = ConnectorIngestion.create!(
          connector_profile: profile,
          upload: upload,
          job: job,
          requested_by: actor,
          object_key: object_key,
          source_path: source_path,
          filename: filename,
          content_type: content_type,
          status: "pending",
          request_id: request_id,
          trace_id: trace_id
        )
        lease, lease_token = ConnectorLease.create_with_token!(
          connector_profile: profile,
          connector_ingestion: ingestion,
          request_id: request_id,
          trace_id: trace_id
        )
        ingestion.update!(status: "leased")
        event_payload = connector_event(upload: upload, job: job, lease: lease, lease_token: lease_token)
        outbox = OutboxEnqueueEventService.call(
          event_name: event_payload[:event_name],
          routing_key: Rails.application.config.x.broker_connector_requested_routing_key,
          payload: event_payload,
          headers: {
            "x-event-name" => event_payload[:event_name],
            "x-payload-version" => event_payload[:payload_version]
          },
          trace_id: trace_id,
          request_id: request_id
        )
        AuditEvent.create!(
          actor: actor,
          auditable: ingestion,
          action: "connector.ingestion.requested",
          request_id: request_id || trace_id,
          trace_id: trace_id,
          occurred_at: Time.current,
          metadata: {
            action: "connector.ingestion.requested",
            upload_id: upload.id,
            job_id: job.id,
            source_type: "connector",
            status: "leased"
          }
        )
      end

      OutboxDispatchEventService.call(event_id: outbox.id) if outbox.present?
      Result.new(upload: upload, job: job, ingestion: ingestion, lease: lease, lease_token: lease_token)
    end

    private

    attr_reader :actor, :profile, :filename, :content_type, :object_key, :source_path, :request_id, :trace_id

    def validate_source!
      if profile.s3? && object_key.blank?
        raise ActiveRecord::RecordInvalid, ConnectorIngestion.new.tap { |record| record.errors.add(:object_key, :blank) }
      end

      return unless profile.http?

      candidate = source_path || profile.settings["url"]
      result = Uploads::PublicLinkUrlPolicy.validate(candidate)
      return if result.valid?

      record = ConnectorIngestion.new
      record.errors.add(:source_path, result.reason)
      raise ActiveRecord::RecordInvalid, record
    end

    def storage_key
      [
        "uploads",
        "connectors",
        actor.id,
        Time.current.utc.strftime("%Y/%m/%d"),
        "#{StreamGate::Id.generate("connup")}-#{safe_filename}"
      ].join("/")
    end

    def safe_filename
      filename.gsub(/[^a-zA-Z0-9._-]/, "_").presence || "connector-upload.dat"
    end

    def connector_event(upload:, job:, lease:, lease_token:)
      {
        event_id: StreamGate::Id.generate("event"),
        event_name: "connector.ingestion.requested.v1",
        occurred_at: Time.current.iso8601,
        producer: "api",
        payload_version: 1,
        correlation_id: request_id || trace_id,
        trace_id: trace_id,
        request_id: request_id,
        upload_id: upload.id,
        job_id: job.id,
        payload: {
          lease_id: lease.id,
          lease_token: lease_token
        }
      }
    end
  end
end
