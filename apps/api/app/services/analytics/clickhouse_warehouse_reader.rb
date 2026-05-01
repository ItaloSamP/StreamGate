module Analytics
  class ClickhouseWarehouseReader
    class Unavailable < StandardError; end

    def initialize(client: ClickhouseClient.new)
      @client = client
    end

    def available?
      client.ping
    rescue ClickhouseClient::Error
      false
    end

    def aggregates(window:, organization_id:)
      rows = query_rows(window: window, organization_id: organization_id)
      {
        last_event_at: parse_time(rows.dig("last_event_at")),
        p95_ms: rows.fetch("p95_ms", 0).to_i,
        error_budget_percent: rows.fetch("error_budget_percent", 100).to_f,
        aggregates: {
          jobs_total: rows.fetch("jobs_total", 0).to_i,
          uploads_total: rows.fetch("uploads_total", 0).to_i,
          records_total: rows.fetch("records_total", 0).to_i,
          valid_records: rows.fetch("valid_records", 0).to_i,
          invalid_records: rows.fetch("invalid_records", 0).to_i,
          by_status: grouped_counts("status", window: window, organization_id: organization_id),
          by_source: grouped_counts("source_type", window: window, organization_id: organization_id)
        }
      }
    rescue ClickhouseClient::Error => e
      raise Unavailable, e.message
    end

    def dashboard(window:, organization_id:)
      {
        last_event_at: dashboard_last_event_at(window: window, organization_id: organization_id),
        p95_ms: dashboard_p95(window: window, organization_id: organization_id),
        error_budget_percent: dashboard_error_budget(window: window, organization_id: organization_id),
        throughput: dashboard_throughput(window: window, organization_id: organization_id),
        queue: dashboard_queue(window: window, organization_id: organization_id),
        workers: dashboard_workers(window: window, organization_id: organization_id),
        formats: dashboard_formats(window: window, organization_id: organization_id),
        timeseries_24h: dashboard_timeseries(window: window, organization_id: organization_id),
        status_distribution: dashboard_status_distribution(window: window, organization_id: organization_id),
        heatmap_7d: dashboard_heatmap(window: window, organization_id: organization_id),
        jobs_board: dashboard_jobs(window: window, organization_id: organization_id),
        queue_items: dashboard_queue_items(window: window, organization_id: organization_id),
        ingestion: {
          supported_formats: %w[CSV JSON NDJSON ZIP XLSX Parquet],
          enabled_formats: %w[CSV JSON NDJSON ZIP XLSX Parquet],
          pending_formats: []
        },
        workers_live: []
      }
    rescue ClickhouseClient::Error => e
      raise Unavailable, e.message
    end

    private

    attr_reader :client

    def query_rows(window:, organization_id:)
      response = client.query(<<~SQL.squish)
        SELECT
          countDistinct(job_id) AS jobs_total,
          countDistinct(upload_id) AS uploads_total,
          count() AS records_total,
          countIf(record_status = 'valid') AS valid_records,
          countIf(record_status = 'invalid') AS invalid_records,
          max(processed_at) AS last_event_at,
          toUInt64(quantile(0.95)(processing_latency_ms)) AS p95_ms,
          round((1 - (countIf(record_status = 'invalid') / greatest(count(), 1))) * 100, 2) AS error_budget_percent
        FROM streamgate_records
        WHERE processed_at >= #{quote_time(window.fetch(:from))}
          AND processed_at <= #{quote_time(window.fetch(:to))}
          #{organization_filter(organization_id)}
      SQL
      response.fetch("data", [ {} ]).first || {}
    end

    def grouped_counts(column, window:, organization_id:)
      response = client.query(<<~SQL.squish)
        SELECT #{column}, countDistinct(job_id) AS count
        FROM streamgate_records
        WHERE processed_at >= #{quote_time(window.fetch(:from))}
          AND processed_at <= #{quote_time(window.fetch(:to))}
          #{organization_filter(organization_id)}
        GROUP BY #{column}
      SQL
      response.fetch("data", []).to_h { |row| [ row.fetch(column).to_s, row.fetch("count").to_i ] }
    end

    def dashboard_last_event_at(window:, organization_id:)
      row = first_row(<<~SQL)
        SELECT max(processed_at) AS last_event_at
        FROM streamgate_records
        WHERE processed_at >= #{quote_time(window.fetch(:from))}
          AND processed_at <= #{quote_time(window.fetch(:to))}
          #{organization_filter(organization_id)}
      SQL
      parse_time(row["last_event_at"])
    end

    def dashboard_p95(window:, organization_id:)
      row = first_row(<<~SQL)
        SELECT toUInt64(quantile(0.95)(processing_latency_ms)) AS p95_ms
        FROM streamgate_records
        WHERE processed_at >= #{quote_time(window.fetch(:from))}
          AND processed_at <= #{quote_time(window.fetch(:to))}
          #{organization_filter(organization_id)}
      SQL
      row.fetch("p95_ms", 0).to_i
    end

    def dashboard_error_budget(window:, organization_id:)
      row = first_row(<<~SQL)
        SELECT round((1 - (countIf(record_status = 'invalid') / greatest(count(), 1))) * 100, 2) AS error_budget_percent
        FROM streamgate_records
        WHERE processed_at >= #{quote_time(window.fetch(:from))}
          AND processed_at <= #{quote_time(window.fetch(:to))}
          #{organization_filter(organization_id)}
      SQL
      row.fetch("error_budget_percent", 100).to_f
    end

    def dashboard_throughput(window:, organization_id:)
      row = first_row(<<~SQL)
        SELECT
          countDistinct(job_id) AS jobs_total,
          countDistinct(upload_id) AS uploads_total,
          countIf(status = 'completed') AS completed,
          countIf(status = 'failed') AS failed,
          countIf(status = 'quarantined_with_warnings') AS quarantined
        FROM streamgate_jobs
        WHERE processed_at >= #{quote_time(window.fetch(:from))}
          AND processed_at <= #{quote_time(window.fetch(:to))}
          #{organization_filter(organization_id)}
      SQL
      {
        jobs_total: row.fetch("jobs_total", 0).to_i,
        uploads_total: row.fetch("uploads_total", 0).to_i,
        completed: row.fetch("completed", 0).to_i,
        failed: row.fetch("failed", 0).to_i,
        quarantined: row.fetch("quarantined", 0).to_i
      }
    end

    def dashboard_queue(window:, organization_id:)
      row = first_row(<<~SQL)
        SELECT count() AS processed, 0 AS retried, 0 AS moved_to_dlq
        FROM streamgate_jobs
        WHERE processed_at >= #{quote_time(window.fetch(:from))}
          AND processed_at <= #{quote_time(window.fetch(:to))}
          #{organization_filter(organization_id)}
      SQL
      {
        processed: row.fetch("processed", 0).to_i,
        retried: row.fetch("retried", 0).to_i,
        moved_to_dlq: row.fetch("moved_to_dlq", 0).to_i
      }
    end

    def dashboard_workers(window:, organization_id:)
      row = first_row(<<~SQL)
        SELECT
          countIf(status IN ('completed', 'quarantined_with_warnings')) AS processed,
          countIf(status = 'failed') AS failed_terminal,
          toUInt64(avg(processing_latency_ms)) AS average_latency_ms
        FROM streamgate_jobs
        WHERE processed_at >= #{quote_time(window.fetch(:from))}
          AND processed_at <= #{quote_time(window.fetch(:to))}
          #{organization_filter(organization_id)}
      SQL
      {
        processed: row.fetch("processed", 0).to_i,
        failed_terminal: row.fetch("failed_terminal", 0).to_i,
        average_latency_ms: row.fetch("average_latency_ms", 0).to_i
      }
    end

    def dashboard_formats(window:, organization_id:)
      rows = query(<<~SQL)
        SELECT content_type, countDistinct(job_id) AS count
        FROM streamgate_jobs
        WHERE processed_at >= #{quote_time(window.fetch(:from))}
          AND processed_at <= #{quote_time(window.fetch(:to))}
          #{organization_filter(organization_id)}
        GROUP BY content_type
        ORDER BY count DESC
      SQL
      rows.map { |row| { content_type: row.fetch("content_type", "unknown"), count: row.fetch("count", 0).to_i } }
    end

    def dashboard_timeseries(window:, organization_id:)
      rows = query(<<~SQL)
        SELECT
          toStartOfHour(processed_at) AS bucket,
          count() AS records,
          countDistinct(job_id) AS jobs,
          countIf(record_status = 'invalid') AS failed
        FROM streamgate_records
        WHERE processed_at >= #{quote_time(window.fetch(:from))}
          AND processed_at <= #{quote_time(window.fetch(:to))}
          #{organization_filter(organization_id)}
        GROUP BY bucket
        ORDER BY bucket ASC
      SQL
      rows.map do |row|
        {
          label: Time.zone.parse(row.fetch("bucket").to_s).strftime("%Hh"),
          bucket: row.fetch("bucket").to_s,
          records: row.fetch("records", 0).to_i,
          jobs: row.fetch("jobs", 0).to_i,
          failed: row.fetch("failed", 0).to_i,
          volume_gb: 0
        }
      end
    end

    def dashboard_status_distribution(window:, organization_id:)
      rows = query(<<~SQL)
        SELECT status, countDistinct(job_id) AS count
        FROM streamgate_jobs
        WHERE processed_at >= #{quote_time(window.fetch(:from))}
          AND processed_at <= #{quote_time(window.fetch(:to))}
          #{organization_filter(organization_id)}
        GROUP BY status
      SQL
      rows.map { |row| { status: row.fetch("status").to_s, count: row.fetch("count", 0).to_i } }
    end

    def dashboard_heatmap(window:, organization_id:)
      rows = query(<<~SQL)
        SELECT
          toDayOfWeek(processed_at) AS day,
          intDiv(toHour(processed_at), 3) AS slot,
          count() AS value
        FROM streamgate_records
        WHERE processed_at >= #{quote_time(window.fetch(:from))}
          AND processed_at <= #{quote_time(window.fetch(:to))}
          #{organization_filter(organization_id)}
        GROUP BY day, slot
      SQL
      labels = %w[00-03 03-06 06-09 09-12 12-15 15-18 18-21 21-24]
      matrix = Array.new(8) { Array.new(7, 0) }
      rows.each do |row|
        day_index = row.fetch("day", 1).to_i - 1
        slot = row.fetch("slot", 0).to_i
        matrix[slot][day_index] = row.fetch("value", 0).to_i if matrix[slot] && day_index.between?(0, 6)
      end
      {
        days: %w[Seg Ter Qua Qui Sex Sab Dom],
        rows: labels.each_with_index.map { |range, index| { range: range, values: matrix[index] } }
      }
    end

    def dashboard_jobs(window:, organization_id:)
      rows = query(<<~SQL)
        SELECT job_id, upload_id, source_type, status, quarantined_records_count, trace_id, job_created_at, processed_at
        FROM streamgate_jobs
        WHERE processed_at >= #{quote_time(window.fetch(:from))}
          AND processed_at <= #{quote_time(window.fetch(:to))}
          #{organization_filter(organization_id)}
        ORDER BY processed_at DESC
        LIMIT 50
      SQL
      rows.map do |row|
        {
          id: row.fetch("job_id"),
          upload_id: row.fetch("upload_id"),
          source_type: row.fetch("source_type"),
          status: row.fetch("status"),
          quarantined_records_count: row.fetch("quarantined_records_count", 0).to_i,
          trace_id: row.fetch("trace_id"),
          created_at: parse_time(row.fetch("job_created_at"))&.iso8601,
          updated_at: parse_time(row.fetch("processed_at"))&.iso8601
        }
      end
    end

    def dashboard_queue_items(window:, organization_id:)
      dashboard_jobs(window: window, organization_id: organization_id)
        .select { |row| row[:status] == "pending" }
        .first(25)
        .each_with_index
        .map { |row, index| { position: index + 1, name: row[:upload_id], job_id: row[:id], eta: "~" } }
    end

    def first_row(sql)
      query(sql).first || {}
    end

    def query(sql)
      client.query(sql.squish).fetch("data", [])
    end

    def organization_filter(organization_id)
      return "" if organization_id.blank?

      "AND organization_id = #{quote(organization_id)}"
    end

    def quote_time(value)
      quote(value.utc.strftime("%Y-%m-%d %H:%M:%S"))
    end

    def quote(value)
      "'#{value.to_s.gsub("'", "\\\\'")}'"
    end

    def parse_time(value)
      return nil if value.blank?

      Time.zone.parse(value.to_s)
    end
  end
end
