module Api
  module V1
    class AnalyticsWarehouseController < ApplicationController
      include OperationalFilters

      before_action :authenticate_request!

      def show
        window = resolve_window!
        return if window.nil?

        snapshots = scoped_snapshots.where(job_created_at: window[:from]..window[:to])
        clickhouse = Analytics::ClickhouseWarehouseReader.new
        if clickhouse.available?
          begin
            return render_clickhouse(window: window, reader: clickhouse)
          rescue Analytics::ClickhouseWarehouseReader::Unavailable => e
            record_clickhouse_warning(e)
          end
        end

        render_postgres_derived(window: window, snapshots: snapshots)
      end

      private

      def render_clickhouse(window:, reader:)
        target = Rails.application.config.x.analytics_slo_target_seconds
        result = reader.aggregates(window: window, organization_id: current_organization.id)
        last_event_at = result[:last_event_at]
        lag_seconds = last_event_at ? (Time.current - last_event_at).round : nil

        render_success(
          data: {
            source: "clickhouse",
            generated_at: Time.current.iso8601,
            last_event_at: last_event_at&.iso8601,
            lag_seconds: lag_seconds,
            stale: lag_seconds.nil? || lag_seconds > target,
            slo_target_seconds: target,
            p95_ms: result[:p95_ms],
            error_budget_percent: result[:error_budget_percent],
            dependency_status: {
              clickhouse: "healthy",
              postgres: "healthy"
            },
            fallback_reason: nil,
            aggregates: result[:aggregates]
          }
        )
      end

      def render_postgres_derived(window:, snapshots:)
        metrics = WorkerProcessingMetric.where(job_id: snapshots.select(:job_id), processed_at: window[:from]..window[:to])
        batches = JobBatch.where(job_id: snapshots.select(:job_id))
        last_event_at = metrics.maximum(:processed_at) || snapshots.maximum(:last_synced_at)
        target = Rails.application.config.x.analytics_slo_target_seconds
        lag_seconds = last_event_at ? (Time.current - last_event_at).round : nil

        render_success(
          data: {
            source: "postgres_derived",
            generated_at: Time.current.iso8601,
            last_event_at: last_event_at&.iso8601,
            lag_seconds: lag_seconds,
            stale: lag_seconds.nil? || lag_seconds > target,
            slo_target_seconds: target,
            p95_ms: p95(metrics.pluck(:processing_latency_ms)),
            error_budget_percent: error_budget_percent(metrics),
            dependency_status: {
              clickhouse: "unavailable",
              postgres: "healthy"
            },
            fallback_reason: "clickhouse_unavailable",
            aggregates: {
              jobs_total: snapshots.count,
              uploads_total: snapshots.select(:upload_id).distinct.count,
              records_total: batches.sum(:input_rows),
              valid_records: batches.sum(:valid_rows),
              invalid_records: batches.sum(:invalid_rows),
              by_status: snapshots.group(:status).count,
              by_source: snapshots.group(:source_type).count
            }
          }
        )
      end

      def scoped_snapshots
        AnalyticsJobSnapshot.where(organization_id: current_organization.id)
      end

      def record_clickhouse_warning(error)
        OperationalWarning.create!(
          code: "clickhouse_warehouse_read_failed",
          message: error.message.to_s[0, 1_000],
          status: "open",
          severity: "warning",
          retry_count: 0,
          expires_at: Rails.application.config.x.operational_warning_retention_days.days.from_now,
          trace_id: Current.trace_id,
          request_id: Current.request_id
        )
      rescue ActiveRecord::ActiveRecordError
        Rails.logger.warn("failed to persist clickhouse warehouse warning")
      end

      def p95(values)
        values = values.compact.map(&:to_i).sort
        return 0 if values.empty?

        values[[ (values.size * 0.95).ceil - 1, 0 ].max]
      end

      def error_budget_percent(metrics)
        total = metrics.count
        return 100.0 if total.zero?

        failures = metrics.where(status: %w[dlq failed_terminal]).count
        ((1 - (failures.to_f / total)) * 100).round(2)
      end
    end
  end
end
