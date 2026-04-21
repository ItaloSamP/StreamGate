module Api
  module V1
    class AuditController < ApplicationController
      include OperationalFilters

      ALLOWED_SORT_COLUMNS = %w[occurred_at action actor_id auditable_type].freeze

      before_action :authenticate_request!

      def index
        return render_api_error(code: "access_denied", message: "Acesso negado para este recurso.", status: :forbidden) unless current_actor.admin?

        window = resolve_window!
        return if window.nil?

        scope = AuditEvent.where(occurred_at: window[:from]..window[:to])
        scope = scope.where("occurred_at >= ?", retention_cutoff)

        event_action = request.query_parameters["action"].to_s.strip
        scope = scope.where(action: event_action) if event_action.present?

        actor_id = params[:actor_id].to_s.strip
        scope = scope.where(actor_id: actor_id) if actor_id.present?

        auditable_type = params[:auditable_type].to_s.strip
        if auditable_type.present?
          allowed_types = %w[Upload Job JobBatch ProcessingAttempt QuarantineRecord]
          return render_invalid_filter!("auditable_type", "invalid") unless allowed_types.include?(auditable_type)

          scope = scope.where(auditable_type: auditable_type)
        end

        trace_id = params[:trace_id].to_s.strip
        scope = scope.where(trace_id: trace_id) if trace_id.present?

        request_id = params[:request_id].to_s.strip
        scope = scope.where(request_id: request_id) if request_id.present?

        search = params[:search].to_s.strip
        if search.present?
          term = "%#{search.downcase}%"
          scope = scope.where(
            "LOWER(audit_events.action) LIKE :term OR LOWER(audit_events.trace_id) LIKE :term OR LOWER(audit_events.request_id) LIKE :term",
            term: term
          )
        end

        sorted = apply_sort!(scope, allowed_columns: ALLOWED_SORT_COLUMNS, default_column: "occurred_at")
        return if sorted.nil?

        scope, sort_by, sort_order = sorted
        page = normalized_page
        per_page = normalized_per_page
        total_count = scope.count
        total_pages = (total_count.to_f / per_page).ceil

        records = scope.limit(per_page).offset((page - 1) * per_page)

        render_success(
          data: records.map { |record| AuditEventSerializer.new(record).serializable_hash },
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
              action: event_action.presence,
              actor_id: actor_id.presence,
              auditable_type: auditable_type.presence,
              trace_id: trace_id.presence,
              request_id: request_id.presence,
              search: search.presence,
              sort_by: sort_by,
              sort_order: sort_order,
              retention_days: Rails.application.config.x.audit_retention_days
            }
          }
        )
      end

      private

      def retention_cutoff
        Rails.application.config.x.audit_retention_days.days.ago
      end
    end
  end
end
