module MessagingRuntime
  module_function

  INTEGER = ActiveModel::Type::Integer.new

  def broker_host
    ENV.fetch("BROKER_HOST", "rabbitmq")
  end

  def broker_port
    env_integer("BROKER_PORT", 5672)
  end

  def broker_username
    ENV.fetch("BROKER_USERNAME", ENV.fetch("RABBITMQ_DEFAULT_USER", "streamgate"))
  end

  def broker_password
    ENV.fetch("BROKER_PASSWORD", ENV.fetch("RABBITMQ_DEFAULT_PASS", "streamgate123"))
  end

  def broker_vhost
    ENV.fetch("BROKER_VHOST", "/")
  end

  def broker_management_url
    ENV.fetch("BROKER_MANAGEMENT_URL", "http://rabbitmq:15672/api")
  end

  def exchange_name
    ENV.fetch("BROKER_EXCHANGE", "streamgate.events")
  end

  def upload_received_routing_key
    ENV.fetch("BROKER_UPLOAD_RECEIVED_ROUTING_KEY", "upload.received.v1")
  end

  def upload_received_queue
    ENV.fetch("BROKER_UPLOAD_RECEIVED_QUEUE", "streamgate.worker.upload.received.v1")
  end

  def upload_received_dlq
    ENV.fetch("BROKER_UPLOAD_RECEIVED_DLQ", "streamgate.worker.upload.received.v1.dlq")
  end

  def env_integer(key, fallback)
    parsed = INTEGER.cast(ENV.fetch(key, fallback.to_s))
    parsed.present? && parsed.positive? ? parsed : fallback
  end
end

Rails.application.config.x.broker_host = MessagingRuntime.broker_host
Rails.application.config.x.broker_port = MessagingRuntime.broker_port
Rails.application.config.x.broker_username = MessagingRuntime.broker_username
Rails.application.config.x.broker_password = MessagingRuntime.broker_password
Rails.application.config.x.broker_vhost = MessagingRuntime.broker_vhost
Rails.application.config.x.broker_management_url = MessagingRuntime.broker_management_url
Rails.application.config.x.broker_exchange = MessagingRuntime.exchange_name
Rails.application.config.x.broker_upload_received_routing_key = MessagingRuntime.upload_received_routing_key
Rails.application.config.x.broker_upload_received_queue = MessagingRuntime.upload_received_queue
Rails.application.config.x.broker_upload_received_dlq = MessagingRuntime.upload_received_dlq
