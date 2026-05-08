# frozen_string_literal: true

require "time"

module Worker
  module Runtime
    class PublicLinkRequestedProcessor
      OPERATION = "worker.public_link.requested.consume"

      def initialize(config:, db_client:, storage_client:, logger:, fetcher: nil, scanner: nil)
        @config = config
        @db_client = db_client
        @storage_client = storage_client
        @logger = logger
        @scanner = scanner || MalwareScanner.new(config: config)
        @fetcher = fetcher || PublicLinkFetcher.new(
          storage_client: storage_client,
          max_bytes: config.public_link_max_bytes,
          scanner: @scanner
        )
      end

      def process(event, retry_count:)
        validate_event!(event)
        ids = event_identifiers(event)
        payload = event.fetch("payload")

        update_acquisition_status(ids, "fetching")
        result = fetcher.call(url: payload.fetch("source_url"), storage_key: payload.fetch("storage_key"))

        mark_stored(ids, payload, result)

        {
          publish: {
            routing_key: config.routing_key,
            payload: upload_received_event(ids, payload, result)
          }
        }
      rescue TransientProcessingError => e
        record_warning(ids, code: "public_link_fetch_retrying", status: "retrying", retry_count: retry_count, message: e.message)
        raise
      rescue TerminalProcessingError => e
        mark_failed(ids, e.message)
        record_warning(ids, code: "public_link_fetch_failed", status: "failed", retry_count: retry_count, message: e.message)
        raise
      end

      private

      attr_reader :config, :db_client, :storage_client, :logger, :fetcher, :scanner

      def validate_event!(event)
        required = %w[event_id event_name payload upload_id job_id trace_id]
        missing = required.reject { |key| event.key?(key) }
        raise TerminalProcessingError, "missing_required_fields=#{missing.join(",")}" if missing.any?
        raise TerminalProcessingError, "invalid_event_name=#{event["event_name"]}" unless event["event_name"] == "upload.public_link.requested.v1"
      end

      def event_identifiers(event)
        {
          event_id: event["event_id"],
          event_name: event["event_name"],
          job_id: event["job_id"],
          upload_id: event["upload_id"],
          trace_id: event["trace_id"],
          request_id: event["request_id"] || event["trace_id"],
          correlation_id: event["correlation_id"] || event["request_id"] || event["trace_id"],
          acquisition_id: event.fetch("payload").fetch("acquisition_id")
        }
      end

      def update_acquisition_status(ids, status)
        db_client.with_connection do |connection|
          connection.exec_params(
            "UPDATE upload_acquisitions SET status = $1, updated_at = NOW() WHERE id = $2 AND job_id = $3",
            [status, ids[:acquisition_id], ids[:job_id]]
          )
        end
      end

      def mark_stored(ids, payload, result)
        db_client.with_connection do |connection|
          connection.exec_params(
            <<~SQL,
              UPDATE uploads
                 SET status = 'stored',
                     content_type = $1,
                     byte_size = $2,
                     checksum_sha256 = $3,
                     metadata = metadata || $4::jsonb,
                     updated_at = NOW()
               WHERE id = $5
            SQL
            [
              result.content_type,
              result.byte_size,
              result.checksum_sha256,
              {
                acquisition_status: "stored",
                final_url_masked: payload["url_masked"],
                public_link_content_type: result.content_type
              }.to_json,
              ids[:upload_id]
            ]
          )
          connection.exec_params(
            <<~SQL,
              UPDATE upload_acquisitions
                 SET status = 'stored',
                     content_type = $1,
                     byte_size = $2,
                     completed_at = NOW(),
                     updated_at = NOW(),
                     last_error = NULL
               WHERE id = $3
            SQL
            [result.content_type, result.byte_size, ids[:acquisition_id]]
          )
        end
      end

      def mark_failed(ids, message)
        db_client.with_connection do |connection|
          connection.exec_params(
            "UPDATE upload_acquisitions SET status = 'failed', last_error = $1, updated_at = NOW() WHERE id = $2",
            [message.to_s[0, 1_000], ids[:acquisition_id]]
          )
          connection.exec_params(
            "UPDATE jobs SET status = 'failed', error_code = 'public_link_fetch_failed', error_category = 'integration', updated_at = NOW() WHERE id = $1",
            [ids[:job_id]]
          )
        end
      rescue StandardError
        logger.warn("failed to persist public link failure job_id=#{ids && ids[:job_id]}")
      end

      def record_warning(ids, code:, status:, retry_count:, message:)
        return if ids.nil?

        db_client.with_connection do |connection|
          connection.exec_params(
            <<~SQL,
              INSERT INTO operational_warnings
                (id, job_id, upload_id, code, message, status, severity, retry_count, expires_at, trace_id, request_id, created_at, updated_at)
              VALUES
                ($1, $2, $3, $4, $5, $6, 'warning', $7, NOW() + INTERVAL '30 days', $8, $9, NOW(), NOW())
            SQL
            [
              Worker::Id.generate("warn"),
              ids[:job_id],
              ids[:upload_id],
              code,
              message.to_s[0, 1_000],
              status,
              retry_count,
              ids[:trace_id],
              ids[:request_id]
            ]
          )
        end
      rescue StandardError
        logger.warn("failed to persist public link warning job_id=#{ids[:job_id]}")
      end

      def upload_received_event(ids, payload, result)
        {
          event_id: Worker::Id.generate("event"),
          event_name: "upload.received.v1",
          occurred_at: Time.now.utc.iso8601,
          producer: "worker.public_link",
          payload_version: 1,
          correlation_id: ids[:correlation_id],
          trace_id: ids[:trace_id],
          request_id: ids[:request_id],
          upload_id: ids[:upload_id],
          job_id: ids[:job_id],
          payload: {
            storage_key: payload.fetch("storage_key"),
            checksum_sha256: result.checksum_sha256,
            content_type: result.content_type,
            byte_size: result.byte_size
          }
        }
      end
    end
  end
end
