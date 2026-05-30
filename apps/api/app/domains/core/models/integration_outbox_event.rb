class IntegrationOutboxEvent < ApplicationRecord
  include PrefixedId

  prefixed_id_with "outbox"

  STATUSES = {
    pending: "pending",
    dispatched: "dispatched"
  }.freeze

  enum :status, STATUSES, default: :pending, validate: true

  validates :event_id, :event_name, :routing_key, :request_id, :trace_id, presence: true
  validates :event_id, uniqueness: true

  scope :ready, -> { pending.where("available_at <= ?", Time.current).order(:created_at) }
end
