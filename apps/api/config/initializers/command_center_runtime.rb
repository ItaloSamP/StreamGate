module CommandCenterRuntime
  module_function

  BOOLEAN = ActiveModel::Type::Boolean.new
  INTEGER = ActiveModel::Type::Integer.new

  def env_integer(key, fallback)
    parsed = INTEGER.cast(ENV.fetch(key, fallback.to_s))
    parsed.present? && parsed.positive? ? parsed : fallback
  end

  def env_bool(key, fallback)
    BOOLEAN.cast(ENV.fetch(key, fallback.to_s))
  end

  def encryption_primary_key
    ENV.fetch("ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY", "0123456789abcdef0123456789abcdef")
  end

  def encryption_deterministic_key
    ENV.fetch("ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY", "abcdef0123456789abcdef0123456789")
  end

  def encryption_salt
    ENV.fetch("ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT", "streamgate-command-center-encryption-salt")
  end
end

Rails.application.config.active_record.encryption.primary_key = CommandCenterRuntime.encryption_primary_key
Rails.application.config.active_record.encryption.deterministic_key = CommandCenterRuntime.encryption_deterministic_key
Rails.application.config.active_record.encryption.key_derivation_salt = CommandCenterRuntime.encryption_salt

Rails.application.config.x.realtime_ticket_ttl_seconds = CommandCenterRuntime.env_integer("REALTIME_TICKET_TTL_SECONDS", 60)
Rails.application.config.x.realtime_event_retention_days = CommandCenterRuntime.env_integer("REALTIME_EVENT_RETENTION_DAYS", 7)
Rails.application.config.x.dashboard_export_retention_days = CommandCenterRuntime.env_integer("DASHBOARD_EXPORT_RETENTION_DAYS", 7)
Rails.application.config.x.permission_matrix_enabled = CommandCenterRuntime.env_bool("PERMISSION_MATRIX_ENABLED", true)
Rails.application.config.x.connector_lease_ttl_seconds = CommandCenterRuntime.env_integer("CONNECTOR_LEASE_TTL_SECONDS", 300)
Rails.application.config.x.worker_internal_token = ENV.fetch("WORKER_INTERNAL_TOKEN", "streamgate-worker-dev-token")
Rails.application.config.x.broker_connector_requested_routing_key = ENV.fetch("BROKER_CONNECTOR_REQUESTED_ROUTING_KEY", "connector.ingestion.requested.v1")
