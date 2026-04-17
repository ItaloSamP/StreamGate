class WorkerProcessingMetric < ApplicationRecord
  include PrefixedId

  prefixed_id_with "wmetric"

  belongs_to :job

  validates :event_id, :status, :trace_id, :processed_at, presence: true
end
