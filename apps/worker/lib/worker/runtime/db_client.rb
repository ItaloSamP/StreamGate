# frozen_string_literal: true

require "pg"

module Worker
  module Runtime
    class DbClient
      def initialize(config:)
        @config = config
      end

      def with_connection
        connection = PG.connect(
          host: config.postgres_host,
          port: config.postgres_port,
          dbname: config.postgres_db,
          user: config.postgres_user,
          password: config.postgres_password
        )
        yield(connection)
      ensure
        connection&.close
      end

      def record_processing_metric(
        event_id:,
        job_id:,
        status:,
        retry_count:,
        moved_to_dlq:,
        processing_latency_ms:,
        trace_id:,
        error_code: nil,
        error_class: nil
      )
        with_connection do |connection|
          connection.exec_params(
            <<~SQL,
              INSERT INTO worker_processing_metrics
                (id, event_id, job_id, status, retry_count, moved_to_dlq, processing_latency_ms, error_code, error_class, trace_id, processed_at, created_at, updated_at)
              VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())
            SQL
            [
              Worker::Id.generate("wmetric"),
              event_id,
              job_id,
              status,
              retry_count,
              moved_to_dlq,
              processing_latency_ms,
              error_code,
              error_class,
              trace_id
            ]
          )
        end
      rescue StandardError
        # Metrics are best-effort; do not block pipeline processing.
      end

      private

      attr_reader :config
    end
  end
end
