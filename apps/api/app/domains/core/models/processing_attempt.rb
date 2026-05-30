class ProcessingAttempt < ApplicationRecord
  include PrefixedId

  prefixed_id_with "attempt"

  STATUSES = {
    started: "started",
    succeeded: "succeeded",
    failed: "failed",
    cancelled: "cancelled"
  }.freeze

  enum :status, STATUSES, default: :started, validate: true

  belongs_to :job
  belongs_to :initiated_by, class_name: "User", optional: true, inverse_of: :processing_attempts
  belongs_to :source_attempt, class_name: "ProcessingAttempt", optional: true

  has_many :audit_events, as: :auditable, dependent: :restrict_with_exception

  validates :attempt_number, numericality: { greater_than: 0, only_integer: true }, uniqueness: { scope: :job_id }
  validates :operation, :trace_id, presence: true

  def finish_success!
    update!(status: :succeeded, finished_at: Time.current)
  end

  def finish_failure!(error_code:, retryable:)
    update!(status: :failed, error_code: error_code, retryable: retryable, finished_at: Time.current)
  end
end
