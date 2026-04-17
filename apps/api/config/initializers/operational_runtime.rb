module OperationalRuntime
  module_function

  INTEGER = ActiveModel::Type::Integer.new

  def audit_retention_days
    env_integer("AUDIT_RETENTION_DAYS", 180)
  end

  def operational_reads_slo_p95_ms
    env_integer("OPERATIONAL_READS_SLO_P95_MS", 500)
  end

  def operational_reads_error_budget_percent
    env_integer("OPERATIONAL_READS_ERROR_BUDGET_PERCENT", 1)
  end

  def env_integer(key, fallback)
    parsed = INTEGER.cast(ENV.fetch(key, fallback.to_s))
    parsed.present? && parsed.positive? ? parsed : fallback
  end
end

Rails.application.config.x.audit_retention_days = OperationalRuntime.audit_retention_days
Rails.application.config.x.operational_reads_slo_p95_ms = OperationalRuntime.operational_reads_slo_p95_ms
Rails.application.config.x.operational_reads_error_budget_percent = OperationalRuntime.operational_reads_error_budget_percent
