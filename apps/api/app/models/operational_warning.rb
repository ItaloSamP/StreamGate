class OperationalWarning < ApplicationRecord
  include PrefixedId

  prefixed_id_with "warn"

  STATUSES = {
    open: "open",
    retrying: "retrying",
    resolved: "resolved",
    failed: "failed"
  }.freeze

  SEVERITIES = {
    info: "info",
    warning: "warning",
    error: "error"
  }.freeze

  before_validation :assign_default_expiry, on: :create

  enum :status, STATUSES, default: :open, validate: true
  enum :severity, SEVERITIES, default: :warning, validate: true

  belongs_to :job, optional: true
  belongs_to :upload, optional: true

  validates :code, :message, :trace_id, :expires_at, presence: true
  validates :retry_count, numericality: { greater_than_or_equal_to: 0, only_integer: true }

  private

  def assign_default_expiry
    self.expires_at ||= Rails.application.config.x.operational_warning_retention_days.days.from_now
  end
end
