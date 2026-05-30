module Api
  module V1
    module OperationalFilters
      extend ActiveSupport::Concern

      PRESETS = {
        "last_24h" => 24.hours,
        "last_7d" => 7.days,
        "last_30d" => 30.days
      }.freeze

      DEFAULT_PRESET = "last_7d"
      DEFAULT_PER_PAGE = 20
      MAX_PER_PAGE = 100

      private

      def normalized_page
        page = params[:page].to_i
        page.positive? ? page : 1
      end

      def normalized_per_page
        per_page = params[:per_page].to_i
        per_page = DEFAULT_PER_PAGE if per_page <= 0
        [ per_page, MAX_PER_PAGE ].min
      end

      def resolve_window!
        timezone = params[:timezone].presence || "UTC"
        zone = ActiveSupport::TimeZone[timezone]
        return render_invalid_filter!("timezone", "invalid") if zone.nil?

        from = params[:from].to_s.strip
        to = params[:to].to_s.strip

        if from.present? || to.present?
          return render_invalid_filter!("from_to", "requires_both") if from.blank? || to.blank?

          from_time = zone.parse(from)
          to_time = zone.parse(to)
          return render_invalid_filter!("from_to", "invalid_datetime") if from_time.nil? || to_time.nil?
          return render_invalid_filter!("from_to", "invalid_range") if from_time > to_time

          return {
            from: from_time.utc,
            to: to_time.utc,
            preset: nil,
            timezone: timezone
          }
        end

        preset = params[:preset].to_s.strip
        preset = DEFAULT_PRESET if preset.blank?
        return render_invalid_filter!("preset", "invalid") unless PRESETS.key?(preset)

        now = Time.current
        {
          from: now - PRESETS[preset],
          to: now,
          preset: preset,
          timezone: timezone
        }
      end

      def apply_sort!(scope, allowed_columns:, default_column:)
        sort_by = params[:sort_by].to_s.strip
        sort_by = default_column if sort_by.blank?
        return render_invalid_filter!("sort_by", "invalid") unless allowed_columns.include?(sort_by)

        sort_order = params[:sort_order].to_s.strip.downcase
        sort_order = "desc" if sort_order.blank?
        return render_invalid_filter!("sort_order", "invalid") unless %w[asc desc].include?(sort_order)

        [ scope.order(sort_by => sort_order), sort_by, sort_order ]
      end

      def render_invalid_filter!(field, reason)
        render_api_error(
          code: "validation_failed",
          message: "Filtro invalido para consulta operacional.",
          status: :unprocessable_entity,
          details: [ { field: field, reason: reason } ]
        )
        nil
      end
    end
  end
end
