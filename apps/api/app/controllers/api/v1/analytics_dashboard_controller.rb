module Api
  module V1
    class AnalyticsDashboardController < ApplicationController
      include OperationalFilters

      before_action :authenticate_request!

      def show
        window = resolve_window!
        return if window.nil?

        snapshots = scoped_snapshots.where(job_created_at: window[:from]..window[:to])
        job_ids = snapshots.pluck(:job_id)
        metrics = WorkerProcessingMetric.where(job_id: job_ids, processed_at: window[:from]..window[:to])
        warnings = OperationalWarning.where(job_id: job_ids).where(created_at: window[:from]..window[:to])
        clickhouse_payload = clickhouse_dashboard(window)
        if clickhouse_payload.present?
          return render_expanded_clickhouse(window: window, payload: clickhouse_payload, snapshots: snapshots, metrics: metrics, warnings: warnings)
        end

        render_success(
          data: {
            generated_at: Time.current.iso8601,
            source: snapshots.exists? ? "postgres_derived" : "empty",
            window: serialize_window(window),
            sections: {
              queue: section(status: queue_status(metrics), data: queue_data(metrics)),
              workers: section(status: worker_status(metrics), data: worker_data(metrics)),
              throughput: section(status: snapshots.exists? ? "derived" : "empty", data: throughput_data(snapshots)),
              formats: section(status: snapshots.exists? ? "derived" : "empty", data: format_data(snapshots)),
              warnings: section(status: warnings.exists? ? "degraded" : "empty", data: warning_data(warnings)),
              event_log: section(status: event_log_status(metrics, warnings), data: event_log(job_ids, metrics, warnings, window)),
              timeseries_24h: section(status: "backend-pending", data: aggregate_timeseries(snapshots)),
              status_distribution: section(status: snapshots.exists? ? "derived" : "empty", data: status_distribution_data(snapshots)),
              heatmap_7d: section(status: "backend-pending", data: empty_heatmap),
              jobs_board: section(status: snapshots.exists? ? "derived" : "empty", data: jobs_board_data(snapshots)),
              queue_items: section(status: "derived", data: queue_items_data(snapshots)),
              ingestion: section(status: "derived", data: ingestion_data),
              workers_live: section(status: "backend-pending", data: []),
              alerts: section(status: warnings.exists? ? "degraded" : "empty", data: alerts_data(warnings))
            },
            dependencies: {
              broker: broker_dependency(metrics),
              warehouse: {
                status: "degraded",
                source: "postgres_derived",
                fallback_reason: "clickhouse_unavailable"
              },
              storage: {
                status: snapshots.exists? ? "healthy" : "unavailable"
              }
            },
            slo: slo_payload(metrics)
          }
        )
      end

      private

      def scoped_snapshots
        return AnalyticsJobSnapshot.all if current_actor.admin?

        AnalyticsJobSnapshot.where(organization_id: current_actor.organization_id)
      end

      def clickhouse_dashboard(window)
        reader = Analytics::ClickhouseWarehouseReader.new
        return nil unless reader.available? && reader.respond_to?(:dashboard)

        reader.dashboard(window: window, organization_id: current_actor.admin? ? nil : current_actor.organization_id)
      rescue Analytics::ClickhouseWarehouseReader::Unavailable, StandardError => e
        record_clickhouse_warning(e)
        nil
      end

      def render_expanded_clickhouse(window:, payload:, snapshots:, metrics:, warnings:)
        sections = {
          queue: section(status: "live", data: payload.fetch(:queue, queue_data(metrics))),
          workers: section(status: "live", data: payload.fetch(:workers, worker_data(metrics))),
          throughput: section(status: "live", data: payload.fetch(:throughput, throughput_data(snapshots))),
          formats: section(status: "live", data: payload.fetch(:formats, format_data(snapshots))),
          warnings: section(status: warnings.exists? ? "degraded" : "empty", data: warning_data(warnings)),
          event_log: section(status: event_log_status(metrics, warnings), data: event_log(snapshots.pluck(:job_id), metrics, warnings, window)),
          kpis: section(status: "live", data: payload.fetch(:throughput, throughput_data(snapshots))),
          timeseries_24h: section(status: "live", data: payload.fetch(:timeseries_24h, [])),
          status_distribution: section(status: "live", data: payload.fetch(:status_distribution, [])),
          heatmap_7d: section(status: "live", data: payload.fetch(:heatmap_7d, empty_heatmap)),
          jobs_board: section(status: "live", data: payload.fetch(:jobs_board, [])),
          queue_items: section(status: "live", data: payload.fetch(:queue_items, [])),
          ingestion: section(status: "live", data: payload.fetch(:ingestion, ingestion_data)),
          workers_live: section(status: "live", data: payload.fetch(:workers_live, [])),
          alerts: section(status: warnings.exists? ? "degraded" : "empty", data: alerts_data(warnings))
        }
        last_event_at = payload[:last_event_at]
        target = Rails.application.config.x.analytics_slo_target_seconds
        lag_seconds = last_event_at ? (Time.current - last_event_at).round : nil

        render_success(
          data: {
            generated_at: Time.current.iso8601,
            source: "clickhouse",
            window: serialize_window(window),
            sections: sections,
            dependencies: {
              broker: broker_dependency(metrics),
              warehouse: { status: "healthy", source: "clickhouse", fallback_reason: nil },
              storage: { status: snapshots.exists? ? "healthy" : "unavailable" },
              source_health: {
                status: "healthy",
                source: "clickhouse"
              }
            },
            slo: {
              slo_target_seconds: target,
              last_event_at: last_event_at&.iso8601,
              lag_seconds: lag_seconds,
              stale: lag_seconds.nil? || lag_seconds > target,
              p95_ms: payload.fetch(:p95_ms, 0),
              error_budget_percent: payload.fetch(:error_budget_percent, 100.0)
            }
          }
        )
      end

      def serialize_window(window)
        {
          from: window[:from].iso8601,
          to: window[:to].iso8601,
          preset: window[:preset],
          timezone: window[:timezone]
        }
      end

      def section(status:, data:)
        {
          status: status,
          generated_at: Time.current.iso8601,
          data: data,
          empty_state: status == "empty" ? "no_data_in_window" : nil
        }
      end

      def queue_status(metrics)
        return "empty" if metrics.none?

        metrics.where(moved_to_dlq: true).exists? ? "degraded" : "derived"
      end

      def worker_status(metrics)
        return "empty" if metrics.none?

        metrics.where(status: %w[dlq failed_terminal]).exists? ? "degraded" : "derived"
      end

      def queue_data(metrics)
        {
          processed: metrics.count,
          retried: metrics.where(status: "retried").count,
          moved_to_dlq: metrics.where(moved_to_dlq: true).count
        }
      end

      def worker_data(metrics)
        {
          processed: metrics.where(status: "processed").count,
          failed_terminal: metrics.where(status: "failed_terminal").count,
          average_latency_ms: metrics.average(:processing_latency_ms)&.round || 0
        }
      end

      def throughput_data(snapshots)
        {
          jobs_total: snapshots.count,
          uploads_total: snapshots.select(:upload_id).distinct.count,
          completed: snapshots.where(status: "completed").count,
          failed: snapshots.where(status: "failed").count,
          quarantined: snapshots.where(status: "quarantined_with_warnings").count
        }
      end

      def format_data(snapshots)
        Upload
          .where(id: snapshots.select(:upload_id))
          .group(:content_type)
          .count
          .map { |content_type, count| { content_type: content_type, count: count } }
      end

      def status_distribution_data(snapshots)
        snapshots.group(:status).count.map { |status, count| { status: status, count: count } }
      end

      def aggregate_timeseries(snapshots)
        return [] unless snapshots.exists?

        [ {
          label: "janela",
          records: JobBatch.where(job_id: snapshots.select(:job_id)).sum(:input_rows),
          jobs: snapshots.count,
          failed: snapshots.where(status: "failed").count,
          volume_gb: 0
        } ]
      end

      def empty_heatmap
        {
          days: %w[Seg Ter Qua Qui Sex Sab Dom],
          rows: %w[00-03 03-06 06-09 09-12 12-15 15-18 18-21 21-24].map { |range| { range: range, values: Array.new(7, 0) } }
        }
      end

      def jobs_board_data(snapshots)
        snapshots.order(job_created_at: :desc).limit(50).map do |snapshot|
          {
            id: snapshot.job_id,
            upload_id: snapshot.upload_id,
            requested_by_id: snapshot.actor_id,
            source_type: snapshot.source_type,
            status: snapshot.status,
            quarantined_records_count: snapshot.quarantined_records_count,
            trace_id: snapshot.job&.trace_id,
            created_at: snapshot.job_created_at&.iso8601,
            updated_at: snapshot.last_synced_at&.iso8601
          }
        end
      end

      def queue_items_data(snapshots)
        snapshots.where(status: "pending").order(job_created_at: :asc).limit(25).each_with_index.map do |snapshot, index|
          upload = Upload.find_by(id: snapshot.upload_id)
          {
            position: index + 1,
            name: upload&.filename || snapshot.upload_id,
            byte_size: upload&.byte_size,
            eta: "~",
            job_id: snapshot.job_id
          }
        end
      end

      def ingestion_data
        {
          supported_formats: %w[CSV JSON NDJSON ZIP XLSX Parquet],
          enabled_formats: %w[CSV JSON NDJSON ZIP XLSX Parquet],
          pending_formats: []
        }
      end

      def alerts_data(warnings)
        warnings.order(created_at: :desc).limit(10).map do |warning|
          {
            id: warning.id,
            title: warning.code.humanize,
            message: warning.message,
            severity: warning.severity,
            href: "/quarantine",
            created_at: warning.created_at&.iso8601,
            reviewed_at: warning.reviewed_at&.iso8601,
            dismissed_at: warning.dismissed_at&.iso8601
          }
        end
      end

      def warning_data(warnings)
        {
          open: warnings.where(status: %w[open retrying]).count,
          failed: warnings.where(status: "failed").count,
          resolved: warnings.where(status: "resolved").count
        }
      end

      def event_log_status(metrics, warnings)
        return "degraded" if warnings.exists?
        return "derived" if metrics.exists?

        "empty"
      end

      def event_log(job_ids, metrics, warnings, window)
        entries = []
        entries.concat(worker_metric_events(metrics))
        entries.concat(warning_events(warnings))
        entries.concat(audit_events(job_ids, window))
        entries.sort_by { |entry| entry.fetch(:timestamp).to_s }.reverse.first(50)
      end

      def worker_metric_events(metrics)
        metrics.order(processed_at: :desc).limit(50).map do |metric|
          {
            timestamp: metric.processed_at&.iso8601,
            type: "worker_metric",
            severity: metric.moved_to_dlq? || %w[dlq failed_terminal].include?(metric.status) ? "warning" : "info",
            job_id: metric.job_id,
            upload_id: metric.job&.upload_id,
            status: metric.status,
            message: "Worker processed #{metric.event_id} with status #{metric.status}."
          }
        end
      end

      def warning_events(warnings)
        warnings.order(created_at: :desc).limit(50).map do |warning|
          {
            timestamp: warning.created_at&.iso8601,
            type: "operational_warning",
            severity: warning.severity,
            job_id: warning.job_id,
            upload_id: warning.upload_id,
            status: warning.status,
            message: warning.message
          }
        end
      end

      def audit_events(job_ids, window)
        return [] if job_ids.empty?

        AuditEvent
          .where(auditable_type: "Job", auditable_id: job_ids)
          .where(occurred_at: window[:from]..window[:to])
          .order(occurred_at: :desc)
          .limit(50)
          .map do |event|
            {
              timestamp: event.occurred_at&.iso8601,
              type: "audit",
              severity: "info",
              job_id: event.auditable_id,
              upload_id: event.metadata&.fetch("upload_id", nil),
              status: event.action,
              message: "Audit event #{event.action}."
            }
          end
      end

      def broker_dependency(metrics)
        if metrics.where(moved_to_dlq: true).exists?
          { status: "degraded", reason: "dlq_events_detected" }
        elsif metrics.exists?
          { status: "healthy" }
        else
          { status: "unavailable", reason: "no_worker_metrics" }
        end
      end

      def slo_payload(metrics)
        last_event_at = metrics.maximum(:processed_at)
        lag_seconds = last_event_at ? (Time.current - last_event_at).round : nil
        target = Rails.application.config.x.analytics_slo_target_seconds
        {
          slo_target_seconds: target,
          last_event_at: last_event_at&.iso8601,
          lag_seconds: lag_seconds,
          stale: lag_seconds.nil? || lag_seconds > target,
          p95_ms: p95(metrics.pluck(:processing_latency_ms)),
          error_budget_percent: error_budget_percent(metrics)
        }
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

      def record_clickhouse_warning(error)
        OperationalWarning.create!(
          code: "clickhouse_dashboard_read_failed",
          message: error.message.to_s[0, 1_000],
          status: "open",
          severity: "warning",
          retry_count: 0,
          expires_at: Rails.application.config.x.operational_warning_retention_days.days.from_now,
          trace_id: Current.trace_id,
          request_id: Current.request_id,
          organization_id: current_actor.organization_id
        )
      rescue ActiveRecord::ActiveRecordError
        Rails.logger.warn("failed to persist clickhouse dashboard warning")
      end
    end
  end
end
