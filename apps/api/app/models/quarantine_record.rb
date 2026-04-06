class QuarantineRecord < ApplicationRecord
  include PrefixedId

  prefixed_id_with "quarantine"

  SEVERITIES = {
    warning: "warning",
    error: "error"
  }.freeze

  enum :severity, SEVERITIES, default: :error, validate: true

  belongs_to :job
  belongs_to :job_batch, optional: true

  validates :row_number, numericality: { greater_than: 0, only_integer: true }, allow_nil: true
  validates :code, :message, :trace_id, presence: true
end
