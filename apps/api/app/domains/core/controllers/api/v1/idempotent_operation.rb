module Api
  module V1
    module IdempotentOperation
      extend ActiveSupport::Concern

      private

      def with_idempotency!(scope:, payload:)
        result = Idempotency::GuardService.call(
          actor: current_actor,
          key: request.headers["Idempotency-Key"],
          scope: scope,
          payload: payload,
          trace_id: Current.trace_id,
          request_id: Current.request_id
        ) do
          yield
        end

        case result.reason
        when :missing_key
          render_api_error(code: "idempotency_key_required", message: "Idempotency-Key e obrigatorio para esta operacao.", status: :unprocessable_entity)
        when :conflict
          render_api_error(code: "idempotency_key_conflict", message: "Idempotency-Key ja foi usada com outro payload.", status: :conflict)
        else
          render json: result.body, status: result.status
        end
      end
    end
  end
end
