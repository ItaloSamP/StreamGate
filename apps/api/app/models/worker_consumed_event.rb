class WorkerConsumedEvent < ApplicationRecord
  include PrefixedId

  prefixed_id_with "consumed"

  belongs_to :job
  belongs_to :upload

  validates :event_id, :event_name, :request_id, :trace_id, presence: true
  validates :event_id, uniqueness: true
end
