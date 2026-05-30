module Api
  module V1
    class QuarantineResolutionsController < ApplicationController
      include IdempotentOperation

      before_action :authenticate_request!

      def create
        record = QuarantineRecord.find(params[:id])
        return render_api_error(code: "access_denied", message: "Acesso negado para esta operacao.", status: :forbidden) unless QuarantineRecordPolicy.new(current_actor, record).resolve_quarantine?

        reason = OperationalReason.parse(operation_params[:reason])
        return render_reason_error(reason.reason) unless reason.success?

        with_idempotency!(scope: "quarantine.resolve:#{record.id}", payload: operation_params.to_h) do
          result = Quarantine::ResolveService.call(record: record, actor: current_actor, reason: reason.value)
          if result.success?
            [
              200,
              {
                data: {
                  id: result.record.id,
                  job_id: result.record.job_id,
                  resolution_status: result.record.resolution_status,
                  resolution_reason: result.record.resolution_reason,
                  resolved_by_id: result.record.resolved_by_id,
                  resolved_at: result.record.resolved_at&.iso8601
                }
              }
            ]
          else
            service_error(result.reason)
          end
        end
      end

      private

      def operation_params
        params.fetch(:operation, ActionController::Parameters.new).permit(:reason)
      end

      def render_reason_error(reason)
        render_api_error(code: "validation_failed", message: "Motivo operacional invalido.", status: :unprocessable_entity, details: [ { field: "reason", reason: reason.to_s } ])
      end

      def service_error(reason)
        [ 422, { error: { code: reason.to_s, message: "Operacao nao permitida no estado atual.", request_id: Current.request_id, trace_id: Current.trace_id, correlation_id: Current.correlation_id } } ]
      end
    end
  end
end
