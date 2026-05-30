module Api
  module V1
    class RealtimeEventsController < ApplicationController
      before_action :authenticate_request!

      def index
        return render_api_error(code: "access_denied", message: "Acesso negado para realtime.", status: :forbidden) unless Permissions::Matrix.allowed?(current_actor, "realtime.read", organization_id: current_actor.organization_id)

        scope = RealtimeEvent.active.visible_to(current_actor).order(occurred_at: :desc).limit(limit)
        if params[:since].present?
          since = Time.zone.parse(params[:since].to_s)
          scope = scope.where("occurred_at > ?", since) if since.present?
        end

        render_success(data: scope.map { |event| RealtimeEventSerializer.new(event).serializable_hash })
      end

      private

      def limit
        [ [ params.fetch(:limit, 100).to_i, 1 ].max, 250 ].min
      end
    end
  end
end
