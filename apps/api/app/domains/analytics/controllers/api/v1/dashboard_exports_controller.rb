module Api
  module V1
    class DashboardExportsController < ApplicationController
      include IdempotentOperation
      include OperationalFilters

      before_action :authenticate_request!

      def create
        return render_api_error(code: "access_denied", message: "Acesso negado para export.", status: :forbidden) unless Permissions::Matrix.allowed?(current_actor, "dashboard.export", organization_id: current_actor.organization_id)

        window = resolve_window_from_payload!
        return if window.nil?

        payload = export_params.to_h
        with_idempotency!(scope: "dashboard.export:#{payload[:kind]}:#{payload[:format]}", payload: payload.merge(window: serialize_window(window))) do
          result = DashboardExports::CreateService.call(
            actor: current_actor,
            kind: payload[:kind],
            format: payload[:format],
            window: window
          )
          [
            201,
            {
              data: DashboardExportSerializer.new(result.export).serializable_hash.merge(
                content: result.content,
                kind: result.export.kind,
                format: result.export.format
              )
            }
          ]
        end
      end

      private

      def export_params
        params.require(:export).permit(:kind, :format, :preset, :from, :to, :timezone)
      end

      def resolve_window_from_payload!
        params[:preset] = export_params[:preset] if export_params[:preset].present?
        params[:from] = export_params[:from] if export_params[:from].present?
        params[:to] = export_params[:to] if export_params[:to].present?
        params[:timezone] = export_params[:timezone] if export_params[:timezone].present?
        resolve_window!
      end

      def serialize_window(window)
        {
          from: window[:from].iso8601,
          to: window[:to].iso8601,
          preset: window[:preset],
          timezone: window[:timezone]
        }
      end
    end
  end
end
