module Api
  module V1
    class DlqController < ApplicationController
      include OperationalFilters

      ALLOWED_SORT_COLUMNS = %w[retry_count dead_letter_reason event_id occurred_at].freeze

      before_action :authenticate_request!

      def index
        return render_api_error(code: "access_denied", message: "Acesso negado para este recurso.", status: :forbidden) unless current_actor.admin?
        return render_invalid_filter!("page", "unsupported_for_dlq") if normalized_page > 1

        per_page = normalized_per_page
        result = Messaging::DlqInspector.call(
          limit: per_page,
          queue_name: Rails.application.config.x.broker_upload_received_dlq,
          vhost: Rails.application.config.x.broker_vhost,
          management_url: Rails.application.config.x.broker_management_url,
          username: Rails.application.config.x.broker_username,
          password: Rails.application.config.x.broker_password
        )

        records = apply_filters(result.messages)

        sorted = apply_array_sort!(records)
        return if sorted.nil?

        records, sort_by, sort_order = sorted

        render_success(
          data: records.map { |record| sanitize_record(record) },
          meta: {
            pagination: {
              page: 1,
              per_page: per_page,
              total_count: records.size,
              total_pages: 1
            },
            queue: {
              name: Rails.application.config.x.broker_upload_received_dlq,
              queue_depth: result.queue_depth
            },
            filters: {
              dead_letter_reason: params[:dead_letter_reason].presence,
              event_name: params[:event_name].presence,
              trace_id: params[:trace_id].presence,
              job_id: params[:job_id].presence,
              sort_by: sort_by,
              sort_order: sort_order
            }
          }
        )
      rescue Messaging::DlqInspector::InspectionError => error
        render_api_error(
          code: "dependency_unavailable",
          message: "Nao foi possivel consultar a DLQ no momento.",
          status: :service_unavailable,
          details: [ { field: "dlq", reason: error.message } ]
        )
      end

      private

      def apply_filters(messages)
        messages = filter_by(messages, params[:dead_letter_reason]) { |message, value| message[:dead_letter_reason].to_s == value }
        messages = filter_by(messages, params[:event_name]) { |message, value| message.dig(:payload, "event_name").to_s == value }
        messages = filter_by(messages, params[:trace_id]) { |message, value| message.dig(:payload, "trace_id").to_s == value }
        filter_by(messages, params[:job_id]) { |message, value| message.dig(:payload, "job_id").to_s == value }
      end

      def filter_by(messages, raw_value)
        value = raw_value.to_s.strip
        return messages if value.blank?

        messages.select { |message| yield(message, value) }
      end

      def apply_array_sort!(records)
        sort_by = params[:sort_by].to_s.strip
        sort_by = "retry_count" if sort_by.blank?
        return render_invalid_filter!("sort_by", "invalid") unless ALLOWED_SORT_COLUMNS.include?(sort_by)

        sort_order = params[:sort_order].to_s.strip.downcase
        sort_order = "desc" if sort_order.blank?
        return render_invalid_filter!("sort_order", "invalid") unless %w[asc desc].include?(sort_order)

        sorted = records.sort_by { |record| normalize_sort_value(sort_value(record, sort_by)) }
        sorted.reverse! if sort_order == "desc"
        [ sorted, sort_by, sort_order ]
      end

      def sort_value(record, sort_by)
        case sort_by
        when "retry_count"
          record[:retry_count]
        when "dead_letter_reason"
          record[:dead_letter_reason]
        when "event_id"
          record.dig(:payload, "event_id")
        when "occurred_at"
          record.dig(:payload, "occurred_at")
        else
          record[:retry_count]
        end
      end

      def normalize_sort_value(value)
        return "" if value.nil?

        value.is_a?(String) ? value.downcase : value
      end

      def sanitize_record(record)
        record.merge(
          payload: OperationalPayloadSanitizer.sanitize(record[:payload]),
          headers: OperationalPayloadSanitizer.sanitize(record[:headers])
        )
      end
    end
  end
end
