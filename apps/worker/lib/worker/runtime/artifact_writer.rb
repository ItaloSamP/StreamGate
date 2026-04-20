# frozen_string_literal: true

require "digest"
require "json"
require "time"

module Worker
  module Runtime
    class ArtifactWriter
      ARTIFACTS = %w[processed_dataset quality_report audit_report].freeze
      CONTENT_TYPE = "application/json"

      def initialize(storage_client:, logger:, retention_days: 30)
        @storage_client = storage_client
        @logger = logger
        @retention_days = retention_days
      end

      def call(connection:, ids:, batch_id:, status:, parse_result:)
        generated_at = Time.now.utc.iso8601

        ARTIFACTS.map do |artifact_type|
          body = artifact_body(artifact_type, ids, batch_id, status, parse_result, generated_at)
          payload = JSON.pretty_generate(body)
          storage_key = "artifacts/#{ids[:job_id]}/#{ids[:event_id]}/#{artifact_type}.json"

          storage_client.write_object(storage_key: storage_key, body: payload, content_type: CONTENT_TYPE)
          persist_artifact!(
            connection,
            ids: ids,
            artifact_type: artifact_type,
            storage_key: storage_key,
            payload: payload,
            generated_at: generated_at,
            metadata: body.fetch(:metadata)
          )
          record_artifact_metric!(connection, ids, artifact_type)

          { artifact_type: artifact_type, storage_key: storage_key }
        end
      rescue StandardError => e
        logger.error("artifact generation failed job_id=#{ids[:job_id]} event_id=#{ids[:event_id]} error=#{e.class.name}")
        raise
      end

      private

      attr_reader :storage_client, :logger

      def artifact_body(artifact_type, ids, batch_id, status, parse_result, generated_at)
        metadata = {
          job_id: ids[:job_id],
          upload_id: ids[:upload_id],
          event_id: ids[:event_id],
          batch_id: batch_id,
          status: status,
          generated_at: generated_at,
          trace_id: ids[:trace_id]
        }

        data =
          case artifact_type
          when "processed_dataset"
            {
              input_rows: parse_result.input_rows,
              valid_rows: parse_result.valid_rows,
              invalid_rows: parse_result.invalid_rows
            }
          when "quality_report"
            {
              quality_status: parse_result.invalid_rows.positive? ? "warnings" : "passed",
              invalid_records: parse_result.invalid_records
            }
          else
            {
              operation: UploadReceivedProcessor::OPERATION,
              correlation_id: ids[:correlation_id],
              request_id: ids[:request_id]
            }
          end

        { artifact_type: artifact_type, metadata: metadata, data: data }
      end

      def persist_artifact!(connection, ids:, artifact_type:, storage_key:, payload:, generated_at:, metadata:)
        connection.exec_params(
          <<~SQL,
            INSERT INTO job_artifacts
              (id, job_id, artifact_type, status, storage_key, filename, content_type, byte_size, checksum_sha256, trace_id, request_id, metadata, generated_at, expires_at, created_at, updated_at)
            VALUES
              ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, NOW() + ($14::text || ' days')::interval, NOW(), NOW())
          SQL
          [
            Worker::Id.generate("artifact"),
            ids[:job_id],
            artifact_type,
            "available",
            storage_key,
            "#{artifact_type}.json",
            CONTENT_TYPE,
            payload.bytesize,
            Digest::SHA256.hexdigest(payload),
            ids[:trace_id],
            ids[:request_id],
            metadata.to_json,
            generated_at,
            retention_days
          ]
        )
      end

      def record_artifact_metric!(connection, ids, artifact_type)
        connection.exec_params(
          <<~SQL,
            INSERT INTO worker_processing_metrics
              (id, event_id, job_id, status, retry_count, moved_to_dlq, processing_latency_ms, error_code, error_class, trace_id, processed_at, created_at, updated_at)
            VALUES
              ($1, $2, $3, $4, 0, FALSE, 0, $5, NULL, $6, NOW(), NOW(), NOW())
          SQL
          [
            Worker::Id.generate("wmetric"),
            "#{ids[:event_id]}:#{artifact_type}",
            ids[:job_id],
            "artifact_generated",
            artifact_type,
            ids[:trace_id]
          ]
        )
      end

      attr_reader :retention_days
    end
  end
end
