module Api
  module V1
    class RealtimeTicketsController < ApplicationController
      before_action :authenticate_request!

      def create
        return render_api_error(code: "access_denied", message: "Acesso negado para realtime.", status: :forbidden) unless Permissions::Matrix.allowed?(current_actor, "realtime.read", organization_id: current_actor.organization_id)

        render_success(data: Realtime::TicketIssuer.call(actor: current_actor), status: :created)
      end
    end
  end
end
