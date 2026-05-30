module Api
  module V1
    class AlertsController < ApplicationController
      include IdempotentOperation

      before_action :authenticate_request!

      def review
        warning = OperationalWarning.find(params[:id])
        return render_api_error(code: "access_denied", message: "Acesso negado para revisar alerta.", status: :forbidden) unless OperationalWarningPolicy.new(current_actor, warning).review?

        reason = OperationalReason.parse(operation_params[:reason])
        return render_reason_error(reason.reason) unless reason.success?

        with_idempotency!(scope: "alert.review:#{warning.id}", payload: operation_params.to_h) do
          warning.update!(reviewed_by: current_actor, reviewed_at: Time.current, review_reason: reason.value)
          audit!(warning, "alert.reviewed", reason.value)
          realtime!(warning, "alert.reviewed")
          [ 200, { data: alert_payload(warning, "reviewed") } ]
        end
      end

      def dismiss
        warning = OperationalWarning.find(params[:id])
        return render_api_error(code: "access_denied", message: "Acesso negado para fechar alerta.", status: :forbidden) unless OperationalWarningPolicy.new(current_actor, warning).dismiss?

        reason = OperationalReason.parse(operation_params[:reason])
        return render_reason_error(reason.reason) unless reason.success?

        with_idempotency!(scope: "alert.dismiss:#{warning.id}", payload: operation_params.to_h) do
          warning.update!(dismissed_by: current_actor, dismissed_at: Time.current, dismiss_reason: reason.value, status: "resolved", resolved_at: Time.current)
          audit!(warning, "alert.dismissed", reason.value)
          realtime!(warning, "alert.dismissed")
          [ 200, { data: alert_payload(warning, "dismissed") } ]
        end
      end

      private

      def operation_params
        params.fetch(:operation, ActionController::Parameters.new).permit(:reason)
      end

      def render_reason_error(reason)
        render_api_error(code: "validation_failed", message: "Motivo operacional invalido.", status: :unprocessable_entity, details: [ { field: "reason", reason: reason.to_s } ])
      end

      def alert_payload(warning, action_status)
        OperationalWarningSerializer.new(warning).serializable_hash.merge(status: action_status)
      end

      def audit!(warning, action, reason)
        AuditEvent.create!(
          actor: current_actor,
          auditable: warning,
          action: action,
          request_id: Current.request_id,
          trace_id: Current.trace_id,
          occurred_at: Time.current,
          metadata: {
            action: action,
            status: warning.status,
            reason: reason,
            job_id: warning.job_id,
            upload_id: warning.upload_id
          }
        )
      end

      def realtime!(warning, event_type)
        org_id = warning.organization_id || warning.job&.requested_by&.organization_id || current_actor.organization_id
        Realtime::EventPublisher.call(
          event_type: event_type,
          organization_id: org_id,
          actor_id: current_actor.id,
          resource_type: "OperationalWarning",
          resource_id: warning.id,
          severity: warning.severity,
          payload: { warning_id: warning.id, job_id: warning.job_id, upload_id: warning.upload_id, status: warning.status },
          trace_id: Current.trace_id,
          request_id: Current.request_id
        )
      end
    end
  end
end
