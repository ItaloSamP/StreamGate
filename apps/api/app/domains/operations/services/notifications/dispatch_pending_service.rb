require "net/http"

module Notifications
  class DispatchPendingService < ApplicationService
    def initialize(limit: 25)
      @limit = limit
    end

    def call
      WebhookDelivery.pending.where("next_attempt_at <= ?", Time.current).limit(limit).find_each do |delivery|
        dispatch(delivery)
      end
    end

    private

    attr_reader :limit

    def dispatch(delivery)
      case delivery.channel
      when "email"
        delivery.update!(status: :delivered, attempts_count: delivery.attempts_count + 1, delivered_at: Time.current)
      when "webhook"
        post_webhook(delivery)
      end
    rescue StandardError => error
      delivery.schedule_retry!(error: error.message)
    end

    def post_webhook(delivery)
      url = delivery.notification_setting.webhook_url
      raise "missing webhook url" if url.blank?

      uri = URI.parse(url)
      request = Net::HTTP::Post.new(uri)
      request["Content-Type"] = "application/json"
      request["X-StreamGate-Signature"] = delivery.signature if delivery.signature.present?
      request.body = JSON.generate(delivery.payload)

      response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", open_timeout: 2, read_timeout: 3) do |http|
        http.request(request)
      end

      if response.is_a?(Net::HTTPSuccess)
        delivery.update!(status: :delivered, attempts_count: delivery.attempts_count + 1, delivered_at: Time.current, response_status: response.code.to_i)
      else
        delivery.schedule_retry!(error: "http_#{response.code}")
      end
    end
  end
end
