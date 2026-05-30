module Api
  module V1
    class QuarantineController < ApplicationController
      include OperationalFilters

      ALLOWED_SORT_COLUMNS = %w[created_at severity row_number code].freeze

      before_action :authenticate_request!

      def index
        window = resolve_window!
        return if window.nil?

        scope = base_scope.where(created_at: window[:from]..window[:to])

        severity = params[:severity].to_s.strip
        if severity.present?
          unless QuarantineRecord.severities.key?(severity)
            return render_invalid_filter!("severity", "invalid")
          end

          scope = scope.where(severity: severity)
        end

        job_id = params[:job_id].to_s.strip
        scope = scope.where(job_id: job_id) if job_id.present?

        trace_id = params[:trace_id].to_s.strip
        scope = scope.where(trace_id: trace_id) if trace_id.present?

        search = params[:search].to_s.strip
        if search.present?
          term = "%#{search.downcase}%"
          scope = scope.where(
            "LOWER(quarantine_records.code) LIKE :term OR LOWER(quarantine_records.message) LIKE :term OR LOWER(quarantine_records.trace_id) LIKE :term",
            term: term
          )
        end

        sorted = apply_sort!(scope, allowed_columns: ALLOWED_SORT_COLUMNS, default_column: "created_at")
        return if sorted.nil?

        scope, sort_by, sort_order = sorted
        page = normalized_page
        per_page = normalized_per_page
        total_count = scope.count
        total_pages = (total_count.to_f / per_page).ceil

        records = scope.limit(per_page).offset((page - 1) * per_page)

        render_success(
          data: records.map { |record| QuarantineRecordSerializer.new(record).serializable_hash },
          meta: {
            pagination: {
              page: page,
              per_page: per_page,
              total_count: total_count,
              total_pages: total_pages
            },
            filters: {
              preset: window[:preset],
              from: window[:from].iso8601,
              to: window[:to].iso8601,
              timezone: window[:timezone],
              severity: severity.presence,
              job_id: job_id.presence,
              trace_id: trace_id.presence,
              search: search.presence,
              sort_by: sort_by,
              sort_order: sort_order
            }
          }
        )
      end

      private

      def base_scope
        QuarantineRecord.joins(job: :requested_by).where(users: { organization_id: current_organization.id })
      end
    end
  end
end
