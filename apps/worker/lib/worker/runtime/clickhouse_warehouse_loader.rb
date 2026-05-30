# frozen_string_literal: true

require "json"
require "openssl"
require "time"

module Worker
  module Runtime
    class ClickhouseWarehouseLoader
      class Error < StandardError; end

      def initialize(config:, client: nil)
        @config = config
        @client = client || ClickhouseClient.new(config: config)
      end

      def ensure_schema!
        client.execute(<<~SQL)
          CREATE TABLE IF NOT EXISTS streamgate_jobs (
            job_id String,
            upload_id String,
            organization_id String,
            source_type LowCardinality(String),
            content_type LowCardinality(String),
            status LowCardinality(String),
            input_rows UInt64,
            valid_rows UInt64,
            invalid_rows UInt64,
            quarantined_records_count UInt64,
            job_created_at DateTime,
            processed_at DateTime,
            trace_id String,
            request_id String,
            processing_latency_ms UInt64
          )
          ENGINE = ReplacingMergeTree(processed_at)
          ORDER BY (organization_id, job_id)
          TTL processed_at + INTERVAL #{config.clickhouse_ttl_days} DAY
        SQL

        client.execute(<<~SQL)
          CREATE TABLE IF NOT EXISTS streamgate_records (
            job_id String,
            upload_id String,
            organization_id String,
            batch_id String,
            row_number UInt64,
            record_status LowCardinality(String),
            error_code String,
            source_type LowCardinality(String),
            content_type LowCardinality(String),
            column_names Array(String),
            field_count UInt64,
            record_hash String,
            processed_at DateTime,
            trace_id String,
            request_id String,
            processing_latency_ms UInt64
          )
          ENGINE = ReplacingMergeTree(processed_at)
          ORDER BY (organization_id, job_id, batch_id, row_number, record_status)
          TTL processed_at + INTERVAL #{config.clickhouse_ttl_days} DAY
        SQL

        client.execute("ALTER TABLE streamgate_jobs ADD COLUMN IF NOT EXISTS content_type LowCardinality(String) DEFAULT ''")
        client.execute("ALTER TABLE streamgate_records ADD COLUMN IF NOT EXISTS content_type LowCardinality(String) DEFAULT ''")
      rescue ClickhouseClient::Error => e
        raise Error, e.message
      end

      def call(connection:, ids:, batch_id:, parse_result:, processing_latency_ms: 0)
        ensure_schema!
        context = job_context(connection, ids.fetch(:job_id))
        processed_at = context.fetch("processed_at")

        client.insert_json_each_row("streamgate_jobs", [job_row(context, ids, parse_result, processing_latency_ms, processed_at)])
        client.insert_json_each_row("streamgate_records", record_rows(context, ids, batch_id, parse_result, processing_latency_ms, processed_at))
      rescue ClickhouseClient::Error => e
        raise Error, e.message
      end

      def load_snapshot!(connection:, snapshot:, batch:)
        raise Error, "connection_required" if connection.nil?

        ensure_schema!
        ids = {
          job_id: snapshot.fetch("job_id"),
          upload_id: snapshot.fetch("upload_id"),
          trace_id: snapshot.fetch("trace_id").to_s,
          request_id: snapshot.fetch("request_id").to_s
        }
        parse_result = Worker::Processing::CsvZipParser::ParseResult.new(
          input_rows: batch.fetch("input_rows").to_i,
          valid_rows: batch.fetch("valid_rows").to_i,
          invalid_rows: batch.fetch("invalid_rows").to_i,
          valid_records: synthetic_records(batch.fetch("valid_rows").to_i, "valid"),
          invalid_records: synthetic_records(batch.fetch("invalid_rows").to_i, "invalid")
        )
        context = {
          "job_id" => snapshot.fetch("job_id"),
          "upload_id" => snapshot.fetch("upload_id"),
          "organization_id" => snapshot.fetch("organization_id"),
          "source_type" => snapshot.fetch("source_type"),
          "content_type" => snapshot.fetch("content_type", ""),
          "status" => snapshot.fetch("status"),
          "quarantined_records_count" => snapshot.fetch("quarantined_records_count"),
          "job_created_at" => snapshot.fetch("job_created_at"),
          "processed_at" => snapshot.fetch("last_synced_at")
        }

        client.insert_json_each_row("streamgate_jobs", [job_row(context, ids, parse_result, 0, context.fetch("processed_at"))])
        client.insert_json_each_row("streamgate_records", record_rows(context, ids, batch.fetch("id"), parse_result, 0, context.fetch("processed_at")))
      rescue ClickhouseClient::Error => e
        raise Error, e.message
      end

      private

      attr_reader :config, :client

      def job_context(connection, job_id)
        result = connection.exec_params(
          <<~SQL,
            SELECT
              j.id AS job_id,
              j.upload_id AS upload_id,
              actor.organization_id AS organization_id,
              j.source_type AS source_type,
              up.content_type AS content_type,
              j.status AS status,
              j.quarantined_records_count AS quarantined_records_count,
              j.created_at AS job_created_at,
              NOW() AS processed_at
            FROM jobs j
            INNER JOIN users actor ON actor.id = j.requested_by_id
            INNER JOIN uploads up ON up.id = j.upload_id
            WHERE j.id = $1
          SQL
          [job_id]
        )
        raise Error, "job_context_not_found" if result.ntuples.zero?

        result[0]
      end

      def job_row(context, ids, parse_result, processing_latency_ms, processed_at)
        {
          job_id: context.fetch("job_id"),
          upload_id: context.fetch("upload_id"),
          organization_id: context.fetch("organization_id"),
          source_type: context.fetch("source_type"),
          content_type: context.fetch("content_type", ""),
          status: context.fetch("status"),
          input_rows: parse_result.input_rows.to_i,
          valid_rows: parse_result.valid_rows.to_i,
          invalid_rows: parse_result.invalid_rows.to_i,
          quarantined_records_count: context.fetch("quarantined_records_count").to_i,
          job_created_at: format_time(context.fetch("job_created_at")),
          processed_at: format_time(processed_at),
          trace_id: ids.fetch(:trace_id),
          request_id: ids.fetch(:request_id),
          processing_latency_ms: processing_latency_ms.to_i
        }
      end

      def record_rows(context, ids, batch_id, parse_result, processing_latency_ms, processed_at)
        valid_rows = Array(parse_result.valid_records).map do |record|
          payload = record.fetch(:payload, {})
          record_row(context, ids, batch_id, processed_at, processing_latency_ms, record, "valid", "", payload)
        end
        invalid_rows = Array(parse_result.invalid_records).map do |record|
          payload = record.fetch(:payload, {})
          record_row(context, ids, batch_id, processed_at, processing_latency_ms, record, "invalid", record.fetch(:code, ""), payload)
        end
        valid_rows + invalid_rows
      end

      def synthetic_records(count, status)
        Array.new(count) do |index|
          {
            row_number: index + 1,
            code: status == "invalid" ? "backfilled_invalid" : nil,
            payload: { "backfill_status" => status, "ordinal" => (index + 1).to_s }
          }
        end
      end

      def record_row(context, ids, batch_id, processed_at, processing_latency_ms, record, status, error_code, payload)
        keys = payload.respond_to?(:keys) ? payload.keys.map(&:to_s).sort : []
        {
          job_id: context.fetch("job_id"),
          upload_id: context.fetch("upload_id"),
          organization_id: context.fetch("organization_id"),
          batch_id: batch_id,
          row_number: record.fetch(:row_number).to_i,
          record_status: status,
          error_code: error_code,
          source_type: context.fetch("source_type"),
          content_type: context.fetch("content_type", ""),
          column_names: keys,
          field_count: keys.size,
          record_hash: record_hash(payload),
          processed_at: format_time(processed_at),
          trace_id: ids.fetch(:trace_id),
          request_id: ids.fetch(:request_id),
          processing_latency_ms: processing_latency_ms.to_i
        }
      end

      def record_hash(payload)
        normalized = JSON.generate(payload.sort.to_h)
        OpenSSL::HMAC.hexdigest("SHA256", config.clickhouse_hmac_secret, normalized)
      end

      def format_time(value)
        return value.utc.strftime("%Y-%m-%d %H:%M:%S") if value.respond_to?(:utc)

        Time.parse(value.to_s).utc.strftime("%Y-%m-%d %H:%M:%S")
      end
    end
  end
end
