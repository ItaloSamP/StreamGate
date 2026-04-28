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
