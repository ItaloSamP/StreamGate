module Api
  module V1
    class DlqReplayRequestsController < ApplicationController
      include IdempotentOperation

      before_action :authenticate_request!

      def create
        return render_api_error(code: "access_denied", message: "Acesso negado para esta operacao.", status: :forbidden) unless current_actor.admin?

        reason = OperationalReason.parse(operation_params[:reason])
        return render_reason_error(reason.reason) unless reason.success?

        with_idempotency!(scope: "dlq_replay.request:#{params[:message_id]}", payload: operation_params.to_h) do
          result = DlqReplayRequests::CreateService.call(
            actor: current_actor,
            message_id: params[:message_id],
            reason: reason.value,
            payload: operation_params[:payload] || {}
          )
          result.success? ? [ 201, { data: DlqReplayRequestSerializer.new(result.request).serializable_hash } ] : service_error(result.reason)
        end
      end

      def approve
        replay_request = DlqReplayRequest.find(params[:id])
        return render_api_error(code: "access_denied", message: "Acesso negado para esta operacao.", status: :forbidden) unless DlqReplayRequestPolicy.new(current_actor, replay_request).approve_dlq_replay?

        reason = OperationalReason.parse(operation_params[:reason])
        return render_reason_error(reason.reason) unless reason.success?

        with_idempotency!(scope: "dlq_replay.approve:#{replay_request.id}", payload: operation_params.to_h) do
          result = DlqReplayRequests::ApproveService.call(request: replay_request, actor: current_actor, reason: reason.value)
          result.success? ? [ 200, { data: DlqReplayRequestSerializer.new(result.request).serializable_hash } ] : service_error(result.reason)
        end
      end

      def execute
        replay_request = DlqReplayRequest.find(params[:id])
        return render_api_error(code: "access_denied", message: "Acesso negado para esta operacao.", status: :forbidden) unless DlqReplayRequestPolicy.new(current_actor, replay_request).execute_dlq_replay?

        reason = OperationalReason.parse(operation_params[:reason])
        return render_reason_error(reason.reason) unless reason.success?

        with_idempotency!(scope: "dlq_replay.execute:#{replay_request.id}", payload: operation_params.to_h) do
          result = DlqReplayRequests::ExecuteService.call(request: replay_request, actor: current_actor, reason: reason.value)
          result.success? ? [ 202, { data: DlqReplayRequestSerializer.new(result.request).serializable_hash } ] : service_error(result.reason)
        end
      end

      private

      def operation_params
        params.fetch(:operation, ActionController::Parameters.new).permit(:reason, payload: {})
      end

      def render_reason_error(reason)
        render_api_error(code: "validation_failed", message: "Motivo operacional invalido.", status: :unprocessable_entity, details: [ { field: "reason", reason: reason.to_s } ])
      end

      def service_error(reason)
        [ 422, { error: { code: reason.to_s, message: "Operacao de replay invalida.", request_id: Current.request_id, trace_id: Current.trace_id, correlation_id: Current.correlation_id } } ]
      end
    end
  end
end
