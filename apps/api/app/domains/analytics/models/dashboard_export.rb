class DashboardExport < ApplicationRecord
  include PrefixedId

  prefixed_id_with "dash_export"

  KINDS = {
    snapshot: "snapshot",
    series: "series",
    heatmap: "heatmap",
    event_log: "event_log"
  }.freeze

  FORMATS = {
    csv: "csv",
    json: "json"
  }.freeze

  before_validation :assign_defaults, on: :create

  enum :kind, KINDS, validate: true
  enum :format, FORMATS, validate: true

  belongs_to :actor, class_name: "User"

  validates :organization_id, :filename, :content_type, :checksum_sha256, :generated_at, :expires_at, :trace_id, presence: true
  validates :byte_size, numericality: { greater_than_or_equal_to: 0, only_integer: true }

  private

  def assign_defaults
    self.generated_at ||= Time.current
    self.expires_at ||= Rails.application.config.x.dashboard_export_retention_days.days.from_now
  end
end
