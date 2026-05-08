# frozen_string_literal: true

require "stringio"
require "time"

module Worker
  module Runtime
    class UploadScanRequestedProcessor
      def initialize(config:, db_client:, storage_client:, scanner:, logger:)
        @config = config
        @db_client = db_client
        @storage_client = storage_client
        @scanner = scanner
        @logger = logger
      end

      def process(event, retry_count:)
        logger.debug("upload scan retry_count=#{retry_count}") if retry_count.to_i.positive?
        validate_event!(event)
        ids = event_identifiers(event)
        payload = event.fetch("payload")

        mark_scanning(ids)
        raw_content = storage_client.read_object(storage_key: payload.fetch("storage_key"))
        result = scanner.scan_io(StringIO.new(raw_content.to_s.b))

        if result.infected?
          quarantine!(ids, result)
          return :quarantined
        end

        mark_clean(ids, result)
        {
          publish: {
            routing_key: config.routing_key,
            payload: upload_received_event(ids, payload)
          }
        }
      rescue TransientProcessingError
        mark_error(ids, "scanner_unavailable") if defined?(ids) && ids
        raise
      rescue KeyError => e
        raise TerminalProcessingError, "scan_payload_missing_key: #{e.message}"
      end

      private

      attr_reader :config, :db_client, :storage_client, :scanner, :logger

      def validate_event!(event)
        required = %w[event_id event_name payload upload_id job_id trace_id]
        missing = required.reject { |key| event.key?(key) }
        raise TerminalProcessingError, "missing_required_fields=#{missing.join(",")}" if missing.any?
        raise TerminalProcessingError, "invalid_event_name=#{event["event_name"]}" unless event["event_name"] == "upload.scan.requested.v1"
      end

      def event_identifiers(event)
        {
          event_id: event["event_id"],
          event_name: event["event_name"],
          job_id: event["job_id"],
          upload_id: event["upload_id"],
          trace_id: event["trace_id"],
          request_id: event["request_id"] || event["trace_id"],
          correlation_id: event["correlation_id"] || event["request_id"] || event["trace_id"]
        }
      end

      def mark_scanning(ids)
        db_client.with_connection do |connection|
          connection.exec_params(
            "UPDATE malware_scans SET status = 'scanning', updated_at = NOW() WHERE upload_id = $1 AND job_id = $2",
            [ids[:upload_id], ids[:job_id]]
          )
        end
      end

      def mark_clean(ids, result)
        update_scan(ids, status: "clean", signature: result.signature)
      end

      def mark_error(ids, signature)
        update_scan(ids, status: "error", signature: signature)
      rescue StandardError
        logger.warn("failed to persist malware scan error upload_id=#{ids[:upload_id]}")
      end

      def update_scan(ids, status:, signature:)
        db_client.with_connection do |connection|
          connection.exec_params(
            "UPDATE malware_scans SET status = $1, signature = $2, scanned_at = NOW(), updated_at = NOW() WHERE upload_id = $3 AND job_id = $4",
            [status, signature, ids[:upload_id], ids[:job_id]]
          )
        end
      end

      def quarantine!(ids, result)
        db_client.with_connection do |connection|
          connection.exec("BEGIN")
          update_scan_sql(connection, ids, "infected", result.signature)
          connection.exec_params("UPDATE uploads SET status = 'quarantined', updated_at = NOW() WHERE id = $1", [ids[:upload_id]])
          connection.exec_params(
            "UPDATE jobs SET status = 'failed', error_code = 'malware_detected', error_category = 'validation', updated_at = NOW() WHERE id = $1",
            [ids[:job_id]]
          )
          insert_operational_warning(connection, ids, result)
          insert_audit_event(connection, ids)
          insert_realtime_event(connection, ids)
          connection.exec("COMMIT")
        rescue StandardError
          connection.exec("ROLLBACK")
          raise
        end
      end

      def update_scan_sql(connection, ids, status, signature)
        connection.exec_params(
          "UPDATE malware_scans SET status = $1, signature = $2, scanned_at = NOW(), updated_at = NOW() WHERE upload_id = $3 AND job_id = $4",
          [status, signature, ids[:upload_id], ids[:job_id]]
        )
      end

      def insert_operational_warning(connection, ids, result)
        connection.exec_params(
          <<~SQL,
            INSERT INTO operational_warnings
              (id, job_id, upload_id, code, message, status, severity, retry_count, expires_at, trace_id, request_id, created_at, updated_at)
            VALUES
              ($1, $2, $3, $4, $5, 'open', 'error', 0, NOW() + INTERVAL '30 days', $6, $7, NOW(), NOW())
          SQL
          [
            Worker::Id.generate("warn"),
            ids[:job_id],
            ids[:upload_id],
            "malware_detected",
            "Malware detectado pelo scanner #{result.signature}",
            ids[:trace_id],
            ids[:request_id]
          ]
        )
      end

      def insert_audit_event(connection, ids)
        connection.exec_params(
          <<~SQL,
            INSERT INTO audit_events
              (id, action, actor_id, auditable_type, auditable_id, request_id, trace_id, occurred_at, metadata, created_at, updated_at)
            VALUES
              ($1, 'upload.scan.infected', NULL, 'Upload', $2, $3, $4, NOW(), $5::jsonb, NOW(), NOW())
          SQL
          [
            Worker::Id.generate("audit"),
            ids[:upload_id],
            ids[:request_id],
            ids[:trace_id],
            { upload_id: ids[:upload_id], job_id: ids[:job_id], signature: "[REDACTED]" }.to_json
          ]
        )
      end

      def insert_realtime_event(connection, ids)
        connection.exec_params(
          <<~SQL,
            INSERT INTO realtime_events
              (id, event_type, organization_id, actor_id, resource_type, resource_id, severity, payload, occurred_at, expires_at, trace_id, request_id, created_at, updated_at)
            SELECT
              $1, 'upload.scan.infected', users.organization_id, NULL, 'Upload', $2, 'error', $3::jsonb, NOW(), NOW() + INTERVAL '7 days', $4, $5, NOW(), NOW()
            FROM uploads
            INNER JOIN users ON users.id = uploads.user_id
            WHERE uploads.id = $2
          SQL
          [
            Worker::Id.generate("rt"),
            ids[:upload_id],
            { upload_id: ids[:upload_id], job_id: ids[:job_id], status: "quarantined", signature: "[REDACTED]" }.to_json,
            ids[:trace_id],
            ids[:request_id]
          ]
        )
      end

      def upload_received_event(ids, payload)
        {
          event_id: Worker::Id.generate("event"),
          event_name: "upload.received.v1",
          occurred_at: Time.now.utc.iso8601,
          producer: "worker.malware_scan",
          payload_version: 1,
          correlation_id: ids[:correlation_id],
          trace_id: ids[:trace_id],
          request_id: ids[:request_id],
          upload_id: ids[:upload_id],
          job_id: ids[:job_id],
          payload: {
            storage_key: payload.fetch("storage_key"),
            checksum_sha256: payload.fetch("checksum_sha256"),
            content_type: payload.fetch("content_type"),
            byte_size: payload.fetch("byte_size")
          }
        }
      end
    end
  end
end
