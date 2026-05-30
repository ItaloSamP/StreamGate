require "bunny"

module Messaging
  class PublishError < StandardError; end

  class RabbitPublisher
    def initialize(
      host: Rails.application.config.x.broker_host,
      port: Rails.application.config.x.broker_port,
      username: Rails.application.config.x.broker_username,
      password: Rails.application.config.x.broker_password,
      vhost: Rails.application.config.x.broker_vhost,
      exchange_name: Rails.application.config.x.broker_exchange
    )
      @host = host
      @port = port
      @username = username
      @password = password
      @vhost = vhost
      @exchange_name = exchange_name
    end

    def publish!(routing_key:, payload:, headers: {})
      with_channel do |channel|
        exchange = channel.topic(exchange_name, durable: true)
        exchange.publish(
          payload.to_json,
          routing_key: routing_key,
          content_type: "application/json",
          persistent: true,
          headers: headers
        )
      end
    rescue StandardError => error
      raise PublishError, "failed to publish message: #{error.message}"
    end

    private

    attr_reader :host, :port, :username, :password, :vhost, :exchange_name

    def with_channel
      session = Bunny.new(
        hostname: host,
        port: port,
        username: username,
        password: password,
        vhost: vhost,
        automatically_recover: false
      )
      session.start
      channel = session.create_channel
      yield(channel)
    ensure
      channel&.close if channel&.open?
      session&.close if session&.open?
    end
  end
end
