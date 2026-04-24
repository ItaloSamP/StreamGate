module Api
  module V1
    class AnalyticsWarehouseController < ApplicationController
      include OperationalFilters

      before_action :authenticate_request!

      def show
        window = resolve_window!
        return if window.nil?

        snapshots = scoped_snapshots.where(job_created_at: window[:from]..window[:to])
        metrics = WorkerProcessingMetric.where(job_id: snapshots.select(:job_id), processed_at: window[:from]..window[:to])
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
              by_status: snapshots.group(:status).count,
              by_source: snapshots.group(:source_type).count
            }
          }
        )
      end

      private

      def scoped_snapshots
        return AnalyticsJobSnapshot.all if current_actor.admin?

        AnalyticsJobSnapshot.where(organization_id: current_actor.organization_id)
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
