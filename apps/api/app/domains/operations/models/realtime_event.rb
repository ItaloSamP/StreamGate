class RealtimeEvent < ApplicationRecord
  include PrefixedId

  prefixed_id_with "rte"

  SEVERITIES = {
    info: "info",
    warning: "warning",
    error: "error"
  }.freeze

  before_validation :assign_defaults, on: :create
  before_validation :sanitize_payload

  enum :severity, SEVERITIES, default: :info, validate: true

  validates :event_type, :organization_id, :severity, :occurred_at, :expires_at, :trace_id, presence: true

  scope :visible_to, ->(actor) {
    if actor&.admin?
      all
    else
      where(organization_id: actor&.organization_id)
    end
  }
  scope :active, -> { where("expires_at > ?", Time.current) }

  private

  def assign_defaults
    self.occurred_at ||= Time.current
    self.expires_at ||= Rails.application.config.x.realtime_event_retention_days.days.from_now
  end

  def sanitize_payload
    self.payload = Operational::PayloadMasker.call(payload || {})
  end
end
