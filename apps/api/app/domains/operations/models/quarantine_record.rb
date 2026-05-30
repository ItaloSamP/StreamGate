class QuarantineRecord < ApplicationRecord
  include PrefixedId

  prefixed_id_with "quarantine"

  SEVERITIES = {
    warning: "warning",
    error: "error"
  }.freeze

  RESOLUTION_STATUSES = {
    open: "open",
    resolved: "resolved"
  }.freeze

  enum :severity, SEVERITIES, default: :error, validate: true
  enum :resolution_status, RESOLUTION_STATUSES, default: :open, validate: true

  belongs_to :job
  belongs_to :job_batch, optional: true
  belongs_to :resolved_by, class_name: "User", optional: true

  validates :row_number, numericality: { greater_than: 0, only_integer: true }, allow_nil: true
  validates :code, :message, :trace_id, presence: true

  def resolve!(actor:, reason:)
    raise ArgumentError, "quarantine record already resolved" if resolved?

    update!(
      resolution_status: :resolved,
      resolved_by: actor,
      resolution_reason: reason,
      resolved_at: Time.current
    )
  end
end
