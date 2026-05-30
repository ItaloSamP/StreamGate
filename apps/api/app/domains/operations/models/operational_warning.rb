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
  belongs_to :reviewed_by, class_name: "User", optional: true
  belongs_to :dismissed_by, class_name: "User", optional: true

  before_validation :assign_organization_id

  validates :code, :message, :trace_id, :expires_at, presence: true
  validates :retry_count, numericality: { greater_than_or_equal_to: 0, only_integer: true }

  def reviewed?
    reviewed_at.present?
  end

  def dismissed?
    dismissed_at.present?
  end

  private

  def assign_organization_id
    self.organization_id ||= job&.requested_by&.organization_id || upload&.user&.organization_id
  end

  def assign_default_expiry
    self.expires_at ||= Rails.application.config.x.operational_warning_retention_days.days.from_now
  end
end
