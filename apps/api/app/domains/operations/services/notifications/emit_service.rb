require "openssl"

module Notifications
  class EmitService < ApplicationService
    def initialize(recipient:, event_name:, title:, body:, metadata:, trace_id:, request_id:)
      @recipient = recipient
      @event_name = event_name
      @title = title
      @body = body
      @metadata = OperationalPayloadSanitizer.sanitize(metadata)
      @trace_id = trace_id
      @request_id = request_id
    end

    def call
      setting = NotificationSetting.for_user(recipient)
      notification = nil

      notification = create_in_app! if setting.in_app_enabled?
      create_delivery!(setting, notification, :email) if setting.email_enabled?
      create_delivery!(setting, notification, :webhook) if setting.webhook_enabled?

      notification
    end

    private

    attr_reader :recipient, :event_name, :title, :body, :metadata, :trace_id, :request_id

    def create_in_app!
      Notification.create!(
        recipient: recipient,
        event_name: event_name,
        title: title,
        body: body,
        metadata: metadata,
        trace_id: trace_id,
        request_id: request_id
      )
    end

    def create_delivery!(setting, notification, channel)
      payload = {
        event_name: event_name,
        title: title,
        body: body,
        metadata: metadata,
        recipient_id: recipient.id
      }
      WebhookDelivery.create!(
        notification: notification,
        notification_setting: setting,
        channel: channel,
        event_name: event_name,
        payload: payload,
        signature: signature_for(setting, payload),
        trace_id: trace_id,
        request_id: request_id
      )
    end

    def signature_for(setting, payload)
      return nil if setting.webhook_secret_digest.blank?

      OpenSSL::HMAC.hexdigest("sha256", setting.webhook_secret_digest, JSON.generate(payload))
    end
  end
end
