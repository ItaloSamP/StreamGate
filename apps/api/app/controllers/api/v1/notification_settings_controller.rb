module Api
  module V1
    class NotificationSettingsController < ApplicationController
      include IdempotentOperation

      before_action :authenticate_request!

      def show
        setting = NotificationSetting.for_user(current_actor)
        render_success(data: NotificationSettingSerializer.new(setting).serializable_hash)
      end

      def update
        setting = NotificationSetting.for_user(current_actor)
        return render_api_error(code: "access_denied", message: "Acesso negado para esta operacao.", status: :forbidden) unless NotificationSettingPolicy.new(current_actor, setting).manage_notification_settings?

        setting.update!(setting_params)
        render_success(data: NotificationSettingSerializer.new(setting).serializable_hash)
      end

      def test_webhook
        setting = NotificationSetting.for_user(current_actor)
        return render_api_error(code: "access_denied", message: "Acesso negado para esta operacao.", status: :forbidden) unless NotificationSettingPolicy.new(current_actor, setting).manage_notification_settings?
        return render_api_error(code: "validation_failed", message: "Webhook nao esta habilitado.", status: :unprocessable_entity) unless setting.webhook_enabled?

        with_idempotency!(scope: "notification_settings.webhook_test:#{setting.id}", payload: operation_params.to_h) do
          delivery = WebhookDelivery.create!(
            notification_setting: setting,
            channel: :webhook,
            event_name: "notification.webhook_test",
            payload: OperationalPayloadSanitizer.sanitize({ reason: operation_params[:reason], actor_id: current_actor.id }),
            signature: "test",
            trace_id: Current.trace_id,
            request_id: Current.request_id
          )

          [ 202, { data: WebhookDeliverySerializer.new(delivery).serializable_hash } ]
        end
      end

      private

      def setting_params
        params.fetch(:notification_setting, ActionController::Parameters.new).permit(:in_app_enabled, :email_enabled, :webhook_enabled, :webhook_url)
      end

      def operation_params
        params.fetch(:operation, ActionController::Parameters.new).permit(:reason)
      end
    end
  end
end
