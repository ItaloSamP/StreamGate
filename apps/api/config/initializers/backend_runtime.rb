module OperationalBackendRuntime
  module_function

  INTEGER = ActiveModel::Type::Integer.new

  def env_integer(key, fallback)
    parsed = INTEGER.cast(ENV.fetch(key, fallback.to_s))
    parsed.present? && parsed.positive? ? parsed : fallback
  end
end

Rails.application.config.x.operational_action_cooldown_seconds = OperationalBackendRuntime.env_integer("OPERATIONAL_ACTION_COOLDOWN_SECONDS", 60)
Rails.application.config.x.operational_action_daily_limit = OperationalBackendRuntime.env_integer("OPERATIONAL_ACTION_DAILY_LIMIT", 25)
Rails.application.config.x.idempotency_key_ttl_seconds = OperationalBackendRuntime.env_integer("IDEMPOTENCY_KEY_TTL_SECONDS", 86_400)
Rails.application.config.x.job_artifact_retention_days = OperationalBackendRuntime.env_integer("JOB_ARTIFACT_RETENTION_DAYS", 30)
Rails.application.config.x.notification_retention_days = OperationalBackendRuntime.env_integer("NOTIFICATION_RETENTION_DAYS", 30)
Rails.application.config.x.notification_delivery_retention_days = OperationalBackendRuntime.env_integer("NOTIFICATION_DELIVERY_RETENTION_DAYS", 30)
Rails.application.config.x.dlq_replay_request_retention_days = OperationalBackendRuntime.env_integer("DLQ_REPLAY_REQUEST_RETENTION_DAYS", 30)
Rails.application.config.x.artifact_download_url_ttl_seconds = OperationalBackendRuntime.env_integer("ARTIFACT_DOWNLOAD_URL_TTL_SECONDS", 300)
Rails.application.config.x.operational_warning_retention_days = OperationalBackendRuntime.env_integer("OPERATIONAL_WARNING_RETENTION_DAYS", 30)
Rails.application.config.x.analytics_slo_target_seconds = OperationalBackendRuntime.env_integer("ANALYTICS_SLO_TARGET_SECONDS", 300)
