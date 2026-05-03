class Job < ApplicationRecord
  include PrefixedId

  prefixed_id_with "job"

  STATUSES = {
    pending: "pending",
    processing: "processing",
    completed: "completed",
    failed: "failed",
    quarantined_with_warnings: "quarantined_with_warnings"
  }.freeze

  ERROR_CATEGORIES = {
    validation: "validation",
    domain_rule: "domain_rule",
    transient_infra: "transient_infra",
    integration: "integration",
    unexpected: "unexpected"
  }.freeze

  enum :status, STATUSES, default: :pending, validate: true
  enum :error_category, ERROR_CATEGORIES, prefix: true, validate: { allow_nil: true }

  belongs_to :upload
  belongs_to :requested_by, class_name: "User", inverse_of: :requested_jobs

  has_many :job_batches, dependent: :restrict_with_exception
  has_many :quarantine_records, dependent: :restrict_with_exception
  has_many :processing_attempts, dependent: :restrict_with_exception
  has_many :job_artifacts, dependent: :restrict_with_exception
  has_many :operational_warnings, dependent: :restrict_with_exception
  has_many :audit_events, as: :auditable, dependent: :restrict_with_exception
  has_one :upload_acquisition, dependent: :restrict_with_exception
  has_one :analytics_job_snapshot, dependent: :restrict_with_exception
  has_one :connector_ingestion, dependent: :restrict_with_exception

  validates :trace_id, :source_type, :status, presence: true

  def start_processing!
    transition_to!(:processing, from: %w[pending])
  end

  def complete!
    transition_to!(:completed, from: %w[processing quarantined_with_warnings])
  end

  def fail!(error_code:, error_category:)
    self.error_code = error_code
    self.error_category = error_category
    transition_to!(:failed, from: %w[pending processing quarantined_with_warnings])
  end

  def quarantine!
    transition_to!(:quarantined_with_warnings, from: %w[processing])
  end

  private

  def transition_to!(target_status, from:)
    unless from.include?(status)
      raise ArgumentError, "invalid transition from #{status} to #{target_status}"
    end

    update!(status: target_status)
  end
end
