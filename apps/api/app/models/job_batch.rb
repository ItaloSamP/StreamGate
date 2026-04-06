class JobBatch < ApplicationRecord
  include PrefixedId

  prefixed_id_with "batch"

  STATUSES = {
    pending: "pending",
    processing: "processing",
    loaded: "loaded",
    failed: "failed",
    quarantined: "quarantined"
  }.freeze

  enum :status, STATUSES, default: :pending, prefix: true, validate: true

  belongs_to :job
  has_many :quarantine_records, dependent: :nullify
  has_many :audit_events, as: :auditable, dependent: :restrict_with_exception

  validates :batch_number, numericality: { greater_than: 0, only_integer: true }, uniqueness: { scope: :job_id }
  validates :input_rows, :valid_rows, :invalid_rows, numericality: { greater_than_or_equal_to: 0, only_integer: true }
  validates :trace_id, presence: true
end
