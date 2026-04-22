class JobArtifact < ApplicationRecord
  include PrefixedId

  prefixed_id_with "artifact"

  ARTIFACT_TYPES = {
    processed_dataset: "processed_dataset",
    quality_report: "quality_report",
    audit_report: "audit_report"
  }.freeze

  STATUSES = {
    pending: "pending",
    generating: "generating",
    available: "available",
    failed: "failed",
    expired: "expired"
  }.freeze

  enum :artifact_type, ARTIFACT_TYPES, validate: true
  enum :status, STATUSES, default: :pending, validate: true

  belongs_to :job
  has_many :audit_events, as: :auditable, dependent: :restrict_with_exception

  before_validation :apply_default_expiration, on: :create

  validates :storage_key, :filename, :content_type, :trace_id, presence: true
  validates :byte_size, numericality: { greater_than_or_equal_to: 0, only_integer: true }

  private

  def apply_default_expiration
    self.expires_at ||= Rails.application.config.x.job_artifact_retention_days.days.from_now
  end
end
