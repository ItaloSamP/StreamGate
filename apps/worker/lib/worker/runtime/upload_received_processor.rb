# frozen_string_literal: true

module Worker
  module Runtime
    class UploadReceivedProcessor # rubocop:disable Metrics/ClassLength
      OPERATION = "worker.upload_received.consume"
      AUDIT_ALLOWLIST = %w[
        action
        attempt_id
        batch_id
        correlation_id
        error_category
        error_code
        event_id
        event_name
        input_rows
        invalid_rows
        job_id
        request_id
        retryable
        source
        source_type
        status
        trace_id
        upload_id
        valid_rows
      ].freeze

      def initialize(config:, db_client:, storage_client:, parser:, logger:, artifact_writer: nil, notifier: nil, warehouse_loader: nil)
        @config = config
        @db_client = db_client
        @storage_client = storage_client
        @parser = parser
        @logger = logger
        @artifact_writer = artifact_writer || ArtifactWriter.new(
          storage_client: storage_client,
          logger: logger,
          retention_days: config.job_artifact_retention_days
        )
        @notifier = notifier || OperationalNotifier.new(retention_days: config.notification_retention_days)
        @warehouse_loader = warehouse_loader || ClickhouseWarehouseLoader.new(config: config)
      end

      def process(event, retry_count:)
        validate_event!(event)
        ids = event_identifiers(event)

        attempt_id = nil

        db_client.with_connection do |connection|
          connection.exec("BEGIN")
          lock_job!(connection, ids[:job_id], ids[:upload_id])
          unless reserve_event!(connection, ids)
            connection.exec("COMMIT")
            logger.info("duplicate event ignored event_id=#{ids[:event_id]} job_id=#{ids[:job_id]}")
            return :duplicate
          end

          connection.exec_params("UPDATE jobs SET status = 'processing', updated_at = NOW() WHERE id = $1", [ids[:job_id]])
          sync_job_snapshot!(connection, ids[:job_id])

          attempt_number = next_attempt_number(connection, ids[:job_id])
          attempt_id = create_attempt!(connection, ids, attempt_number)
          create_audit_event!(
            connection,
            auditable_type: "Job",
            auditable_id: ids[:job_id],
            action: "worker.job.processing_started",
            actor_id: nil,
            request_id: ids[:request_id],
            trace_id: ids[:trace_id],
            metadata: {
              job_id: ids[:job_id],
              upload_id: ids[:upload_id],
              event_id: ids[:event_id],
              correlation_id: ids[:correlation_id],
              attempt_id: attempt_id,
              status: "processing"
            }
          )
          connection.exec("COMMIT")
        rescue StandardError
          connection.exec("ROLLBACK")
          raise
        end

        parse_result = consume_payload(event)

        batch_id = nil
        db_client.with_connection do |connection|
          connection.exec("BEGIN")
          batch_id = create_batch!(connection, ids, parse_result)
          create_quarantine_records!(connection, ids, batch_id, parse_result)
          finalize_success!(connection, ids, attempt_id, batch_id, parse_result)
          connection.exec("COMMIT")
        rescue StandardError
          connection.exec("ROLLBACK")
          raise
        end

        load_clickhouse_after_commit(ids, batch_id, parse_result)

        :processed
      rescue TransientProcessingError => e
        fail_attempt(attempt_id, ids, error_code: "transient_processing_error", error_category: "transient_infra", retryable: true)
        release_event_reservation(ids)
        logger.warn("transient processing failure event_id=#{ids && ids[:event_id]} job=#{ids && ids[:job_id]} retry_count=#{retry_count} error=#{e.message}")
        raise
      rescue TerminalProcessingError => e
        fail_attempt(attempt_id, ids, error_code: "terminal_processing_error", error_category: "integration", retryable: false)
        fail_job(ids, error_code: "terminal_processing_error", error_category: "integration")
        logger.error("terminal processing failure event_id=#{ids && ids[:event_id]} job=#{ids && ids[:job_id]} error=#{e.message}")
        raise
      rescue StandardError => e
        fail_attempt(attempt_id, ids, error_code: "unexpected_processing_error", error_category: "unexpected", retryable: true)
        release_event_reservation(ids)
        logger.error("unexpected processing failure event_id=#{ids && ids[:event_id]} job=#{ids && ids[:job_id]} error=#{e.class.name}")
        raise TransientProcessingError, "unexpected_processing_error: #{e.class.name}"
      end

      private

      attr_reader :config, :db_client, :storage_client, :parser, :logger, :artifact_writer, :notifier, :warehouse_loader

      def validate_event!(event)
        required = %w[event_id event_name payload upload_id job_id trace_id]
        missing = required.reject { |key| event.key?(key) }
        raise TerminalProcessingError, "missing_required_fields=#{missing.join(",")}" if missing.any?

        raise TerminalProcessingError, "invalid_event_name=#{event["event_name"]}" unless event["event_name"] == "upload.received.v1"
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

      def reserve_event!(connection, ids)
        result = connection.exec_params(
          <<~SQL,
            INSERT INTO worker_consumed_events
              (id, event_id, event_name, job_id, upload_id, request_id, trace_id, processed_at, created_at, updated_at)
            VALUES
              ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())
            ON CONFLICT (event_id) DO NOTHING
            RETURNING id
          SQL
          [
            Worker::Id.generate("consumed"),
            ids[:event_id],
            ids[:event_name],
            ids[:job_id],
            ids[:upload_id],
            ids[:request_id],
            ids[:trace_id]
          ]
        )
        result.ntuples.positive?
      end

      def release_event_reservation(ids)
        return if ids.nil? || ids[:event_id].to_s.empty?

        db_client.with_connection do |connection|
          connection.exec_params("DELETE FROM worker_consumed_events WHERE event_id = $1", [ids[:event_id]])
        end
      rescue StandardError
        # Best effort release; retry path still protected by max-retries.
      end

      def lock_job!(connection, job_id, upload_id)
        result = connection.exec_params("SELECT id FROM jobs WHERE id = $1 AND upload_id = $2 FOR UPDATE", [job_id, upload_id])
        raise TerminalProcessingError, "job_not_found_or_upload_mismatch" if result.ntuples.zero?
      end

      def next_attempt_number(connection, job_id)
        result = connection.exec_params("SELECT COALESCE(MAX(attempt_number), 0) AS max_attempt FROM processing_attempts WHERE job_id = $1", [job_id])
        result[0]["max_attempt"].to_i + 1
      end

      def create_attempt!(connection, ids, attempt_number)
        attempt_id = Worker::Id.generate("attempt")
        connection.exec_params(
          <<~SQL,
            INSERT INTO processing_attempts
              (id, job_id, attempt_number, operation, status, trace_id, request_id, started_at, created_at, updated_at, metadata)
            VALUES
              ($1, $2, $3, $4, 'started', $5, $6, NOW(), NOW(), NOW(), $7::jsonb)
          SQL
          [attempt_id, ids[:job_id], attempt_number, OPERATION, ids[:trace_id], ids[:request_id], {}.to_json]
        )
        attempt_id
      end

      def consume_payload(event)
        payload = event.fetch("payload")
        storage_key = payload.fetch("storage_key")
        content_type = payload.fetch("content_type")
        raw_content = storage_client.read_object(storage_key: storage_key)
        parser.parse(content_type: content_type, raw_content: raw_content)
      rescue Aws::S3::Errors::NoSuchKey
        raise TerminalProcessingError, "storage_object_not_found"
      rescue Aws::S3::Errors::ServiceError, Seahorse::Client::NetworkingError => e
        raise TransientProcessingError, "storage_transient_error: #{e.class.name}"
      rescue KeyError => e
        raise TerminalProcessingError, "payload_missing_key: #{e.message}"
      end

      def create_batch!(connection, ids, parse_result)
        batch_id = Worker::Id.generate("batch")
        status = parse_result.invalid_rows.positive? ? "quarantined" : "loaded"
        connection.exec_params(
          <<~SQL,
            INSERT INTO job_batches
              (id, job_id, batch_number, status, input_rows, valid_rows, invalid_rows, trace_id, created_at, updated_at)
            VALUES
              ($1, $2, 1, $3, $4, $5, $6, $7, NOW(), NOW())
          SQL
          [batch_id, ids[:job_id], status, parse_result.input_rows, parse_result.valid_rows, parse_result.invalid_rows, ids[:trace_id]]
        )
        batch_id
      end

      def create_quarantine_records!(connection, ids, batch_id, parse_result)
        parse_result.invalid_records.each do |record|
          connection.exec_params(
            <<~SQL,
              INSERT INTO quarantine_records
                (id, job_id, job_batch_id, row_number, code, message, severity, trace_id, payload, created_at, updated_at)
              VALUES
                ($1, $2, $3, $4, $5, $6, 'warning', $7, $8::jsonb, NOW(), NOW())
            SQL
            [
              Worker::Id.generate("quarantine"),
              ids[:job_id],
              batch_id,
              record[:row_number],
              record[:code],
              record[:message],
              ids[:trace_id],
              record[:payload].to_json
            ]
          )
        end
      end

      def load_clickhouse_after_commit(ids, batch_id, parse_result)
        db_client.with_connection do |connection|
          warehouse_loader.call(
            connection: connection,
            ids: ids,
            batch_id: batch_id,
            parse_result: parse_result,
            processing_latency_ms: 0
          )
        rescue StandardError => e
          record_clickhouse_warning!(connection, ids, e)
          logger.warn("clickhouse load failed job_id=#{ids[:job_id]} error=#{e.class.name}: #{e.message}")
        end
      end

      def record_clickhouse_warning!(connection, ids, error)
        connection.exec_params(
          <<~SQL,
            INSERT INTO operational_warnings
              (id, job_id, upload_id, code, message, status, severity, retry_count, expires_at, trace_id, request_id, created_at, updated_at)
            VALUES
              ($1, $2, $3, 'clickhouse_load_failed', $4, 'open', 'warning', 0, NOW() + INTERVAL '30 days', $5, $6, NOW(), NOW())
          SQL
          [
            Worker::Id.generate("warn"),
            ids[:job_id],
            ids[:upload_id],
            error.message.to_s[0, 1_000],
            ids[:trace_id],
            ids[:request_id]
          ]
        )
      rescue StandardError
        logger.warn("failed to persist clickhouse load warning job_id=#{ids[:job_id]}")
      end

      def finalize_success!(connection, ids, attempt_id, batch_id, parse_result)
        new_status = parse_result.invalid_rows.positive? ? "quarantined_with_warnings" : "completed"
        action = parse_result.invalid_rows.positive? ? "worker.job.quarantined" : "worker.job.completed"
        event_name = parse_result.invalid_rows.positive? ? "job.quarantined_with_warnings" : "job.completed"

        connection.exec_params(
          "UPDATE jobs SET status = $1, quarantined_records_count = $2, updated_at = NOW() WHERE id = $3",
          [new_status, parse_result.invalid_rows, ids[:job_id]]
        )
        sync_job_snapshot!(connection, ids[:job_id])
        connection.exec_params(
          "UPDATE processing_attempts SET status = 'succeeded', finished_at = NOW(), updated_at = NOW() WHERE id = $1",
          [attempt_id]
        )
        create_audit_event!(
          connection,
          auditable_type: "Job",
          auditable_id: ids[:job_id],
          action: action,
          actor_id: nil,
          request_id: ids[:request_id],
          trace_id: ids[:trace_id],
          metadata: {
            job_id: ids[:job_id],
            upload_id: ids[:upload_id],
            event_id: ids[:event_id],
            correlation_id: ids[:correlation_id],
            attempt_id: attempt_id,
            batch_id: batch_id,
            status: new_status,
            input_rows: parse_result.input_rows,
            valid_rows: parse_result.valid_rows,
            invalid_rows: parse_result.invalid_rows
          }
        )
        generate_artifacts_safely!(connection, ids, batch_id, new_status, parse_result)
        notifier.emit_job_transition(
          connection: connection,
          ids: ids,
          status: new_status,
          event_name: event_name,
          title: parse_result.invalid_rows.positive? ? "Job concluido com quarentena" : "Job concluido",
          body: notification_body(ids, parse_result)
        )
      end

      def notification_body(ids, parse_result)
        return "O job #{ids[:job_id]} foi concluido." unless parse_result.invalid_rows.positive?

        "O job #{ids[:job_id]} foi concluido com registros em quarentena."
      end

      def generate_artifacts_safely!(connection, ids, batch_id, status, parse_result)
        artifact_writer.call(connection: connection, ids: ids, batch_id: batch_id, status: status, parse_result: parse_result)
      rescue StandardError => e
        create_audit_event!(
          connection,
          auditable_type: "Job",
          auditable_id: ids[:job_id],
          action: "worker.artifacts.failed",
          actor_id: nil,
          request_id: ids[:request_id],
          trace_id: ids[:trace_id],
          metadata: {
            job_id: ids[:job_id],
            upload_id: ids[:upload_id],
            event_id: ids[:event_id],
            error_code: "artifact_generation_failed",
            error_category: "artifact",
            status: status
          }
        )
        record_artifact_failure_metric!(connection, ids, e)
      end

      def record_artifact_failure_metric!(connection, ids, error)
        connection.exec_params(
          <<~SQL,
            INSERT INTO worker_processing_metrics
              (id, event_id, job_id, status, retry_count, moved_to_dlq, processing_latency_ms, error_code, error_class, trace_id, processed_at, created_at, updated_at)
            VALUES
              ($1, $2, $3, 'artifact_failed', 0, FALSE, 0, 'artifact_generation_failed', $4, $5, NOW(), NOW(), NOW())
          SQL
          [
            Worker::Id.generate("wmetric"),
            "#{ids[:event_id]}:artifact_failed",
            ids[:job_id],
            error.class.name,
            ids[:trace_id]
          ]
        )
      end

      def fail_attempt(attempt_id, ids, error_code:, error_category:, retryable:)
        return if attempt_id.nil?

        db_client.with_connection do |connection|
          connection.exec_params(
            <<~SQL,
              UPDATE processing_attempts
              SET status = 'failed',
                  error_code = $1,
                  retryable = $2,
                  finished_at = NOW(),
                  updated_at = NOW(),
                  metadata = jsonb_build_object('error_category', $3)
              WHERE id = $4
            SQL
            [error_code, retryable, error_category, attempt_id]
          )
          create_audit_event!(
            connection,
            auditable_type: "ProcessingAttempt",
            auditable_id: attempt_id,
            action: "worker.attempt.failed",
            actor_id: nil,
            request_id: ids && ids[:request_id],
            trace_id: ids && ids[:trace_id],
            metadata: {
              attempt_id: attempt_id,
              event_id: ids && ids[:event_id],
              correlation_id: ids && ids[:correlation_id],
              job_id: ids && ids[:job_id],
              error_code: error_code,
              error_category: error_category,
              retryable: retryable
            }
          )
        end
      end

      def fail_job(ids, error_code:, error_category:)
        return if ids.nil?

        db_client.with_connection do |connection|
          connection.exec_params(
            "UPDATE jobs SET status = 'failed', error_code = $1, error_category = $2, updated_at = NOW() WHERE id = $3",
            [error_code, error_category, ids[:job_id]]
          )
          sync_job_snapshot!(connection, ids[:job_id])
          create_audit_event!(
            connection,
            auditable_type: "Job",
            auditable_id: ids[:job_id],
            action: "worker.job.failed",
            actor_id: nil,
            request_id: ids[:request_id],
            trace_id: ids[:trace_id],
            metadata: {
              job_id: ids[:job_id],
              upload_id: ids[:upload_id],
              event_id: ids[:event_id],
              correlation_id: ids[:correlation_id],
              error_code: error_code,
              error_category: error_category,
              status: "failed"
            }
          )
          notifier.emit_job_transition(
            connection: connection,
            ids: ids,
            status: "failed",
            event_name: "job.failed",
            title: "Job falhou",
            body: "O job #{ids[:job_id]} falhou durante o processamento."
          )
        end
      end

      def sync_job_snapshot!(connection, job_id)
        connection.exec_params(
          <<~SQL,
            INSERT INTO analytics_job_snapshots (
              id,
              job_id,
              upload_id,
              actor_id,
              organization_id,
              source_type,
              status,
              quarantined_records_count,
              job_created_at,
              last_synced_at,
              created_at,
              updated_at
            )
            SELECT
              concat('ajs_', j.id),
              j.id,
              j.upload_id,
              j.requested_by_id,
              u.organization_id,
              j.source_type,
              j.status,
              j.quarantined_records_count,
              j.created_at,
              NOW(),
              NOW(),
              NOW()
            FROM jobs j
            INNER JOIN users u ON u.id = j.requested_by_id
            WHERE j.id = $1
            ON CONFLICT (job_id) DO UPDATE SET
              upload_id = EXCLUDED.upload_id,
              actor_id = EXCLUDED.actor_id,
              organization_id = EXCLUDED.organization_id,
              source_type = EXCLUDED.source_type,
              status = EXCLUDED.status,
              quarantined_records_count = EXCLUDED.quarantined_records_count,
              job_created_at = EXCLUDED.job_created_at,
              last_synced_at = EXCLUDED.last_synced_at,
              updated_at = NOW()
          SQL
          [job_id]
        )
      end

      def create_audit_event!(connection, auditable_type:, auditable_id:, action:, actor_id:, request_id:, trace_id:, metadata:)
        safe_metadata = sanitize_metadata(metadata)
        connection.exec_params(
          <<~SQL,
            INSERT INTO audit_events
              (id, action, actor_id, auditable_type, auditable_id, request_id, trace_id, occurred_at, metadata, created_at, updated_at)
            VALUES
              ($1, $2, $3, $4, $5, $6, $7, NOW(), $8::jsonb, NOW(), NOW())
          SQL
          [
            Worker::Id.generate("audit"),
            action,
            actor_id,
            auditable_type,
            auditable_id,
            request_id || trace_id,
            trace_id,
            safe_metadata.to_json
          ]
        )
      end

      def sanitize_metadata(metadata)
        metadata.each_with_object({}) do |(key, value), acc|
          normalized = key.to_s
          acc[normalized] = AUDIT_ALLOWLIST.include?(normalized) ? value : "[REDACTED]"
        end
      end
    end
  end
end
