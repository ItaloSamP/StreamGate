module Api
  module V1
    class JobRetriesController < ApplicationController
      include IdempotentOperation

      before_action :authenticate_request!

      def create
        job = Job.find(params[:job_id])
        return render_api_error(code: "access_denied", message: "Acesso negado para esta operacao.", status: :forbidden) unless JobPolicy.new(current_actor, job).retry_job?

        reason = OperationalReason.parse(operation_params[:reason])
        return render_reason_error(reason.reason) unless reason.success?

        with_idempotency!(scope: "jobs.retry:#{job.id}", payload: operation_params.to_h) do
          result = Jobs::RetryService.call(job: job, actor: current_actor, reason: reason.value)
          if result.success?
            [
              202,
              {
                data: {
                  job_id: job.id,
                  status: "retry_requested",
                  attempt_id: result.attempt.id,
                  outbox_id: result.outbox_event.id
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
        code = reason == :invalid_state ? "invalid_state" : reason.to_s
        status = reason == :invalid_state ? :unprocessable_entity : :too_many_requests
        [ Rack::Utils.status_code(status), { error: { code: code, message: "Operacao nao permitida no estado atual.", request_id: Current.request_id, trace_id: Current.trace_id, correlation_id: Current.correlation_id } } ]
      end
    end
  end
end
