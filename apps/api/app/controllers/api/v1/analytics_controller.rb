module Api
  module V1
    class AnalyticsController < ApplicationController
      include OperationalFilters

      ALLOWED_BREAKDOWN_SORT_COLUMNS = %w[count actor_id status source].freeze

      before_action :authenticate_request!

      def index
        window = resolve_window!
        return if window.nil?

        scope = scoped_snapshots.where(job_created_at: window[:from]..window[:to])

        sort_by = params[:sort_by].to_s.strip
        sort_by = "count" if sort_by.blank?
        return render_invalid_filter!("sort_by", "invalid") unless ALLOWED_BREAKDOWN_SORT_COLUMNS.include?(sort_by)

        sort_order = params[:sort_order].to_s.strip.downcase
        sort_order = "desc" if sort_order.blank?
        return render_invalid_filter!("sort_order", "invalid") unless %w[asc desc].include?(sort_order)

        page = normalized_page
        per_page = normalized_per_page

        status_rows = scope.group(:status).count.map { |status, count| { status: status, count: count } }
        source_rows = scope.group(:source_type).count.map { |source, count| { source: source, count: count } }
        actor_rows = scope.group(:actor_id).count.map { |actor_id, count| { actor_id: actor_id, count: count } }

        actor_sorted = sort_breakdown(actor_rows, key: sort_by, order: sort_order, fallback_key: "count")
        actor_total = actor_sorted.size
        actor_paginated = actor_sorted.slice((page - 1) * per_page, per_page) || []

        job_ids = scope.pluck(:job_id)

        render_success(
          data: {
            window: {
              from: window[:from].iso8601,
              to: window[:to].iso8601,
              preset: window[:preset],
              timezone: window[:timezone]
            },
            kpis: {
              uploads_total: scope.select(:upload_id).distinct.count,
              jobs_total: scope.count,
              jobs_processing: scope.where(status: "processing").count,
              jobs_completed: scope.where(status: "completed").count,
              jobs_failed: scope.where(status: "failed").count,
              jobs_quarantined: scope.where(status: "quarantined_with_warnings").count,
              quarantine_records_total: scope.sum(:quarantined_records_count),
              audit_events_total: AuditEvent.where(auditable_type: "Job", auditable_id: job_ids).count
            },
            breakdowns: {
              status: sort_breakdown(status_rows, key: sort_by, order: sort_order, fallback_key: "count"),
              actor: actor_paginated,
              source: sort_breakdown(source_rows, key: sort_by, order: sort_order, fallback_key: "count")
            }
          },
          meta: {
            pagination: {
              page: page,
              per_page: per_page,
              total_count: actor_total,
              total_pages: (actor_total.to_f / per_page).ceil
            },
            filters: {
              sort_by: sort_by,
              sort_order: sort_order
            }
          }
        )
      end

      private

      def scoped_snapshots
        return AnalyticsJobSnapshot.all if current_actor.admin?

        AnalyticsJobSnapshot.where(organization_id: current_actor.organization_id)
      end

      def sort_breakdown(rows, key:, order:, fallback_key:)
        rows.sort_by do |row|
          value = row[key.to_sym] || row[key] || row[fallback_key.to_sym] || row[fallback_key]
          normalize_sort_value(value)
        end.then { |data| order == "desc" ? data.reverse : data }
      end

      def normalize_sort_value(value)
        return "" if value.nil?

        value.is_a?(String) ? value.downcase : value
      end
    end
  end
end
