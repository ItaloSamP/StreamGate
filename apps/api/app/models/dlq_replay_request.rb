class DlqReplayRequest < ApplicationRecord
  include PrefixedId

  prefixed_id_with "dlqreplay"

  STATUSES = {
    requested: "requested",
    approved: "approved",
    executing: "executing",
    executed: "executed",
    rejected: "rejected",
    failed: "failed"
  }.freeze

  enum :status, STATUSES, default: :requested, validate: true

  belongs_to :requested_by, class_name: "User"
  belongs_to :approved_by, class_name: "User", optional: true
  belongs_to :executed_by, class_name: "User", optional: true

  has_many :audit_events, as: :auditable, dependent: :restrict_with_exception

  before_validation :apply_default_expiration, on: :create

  validates :message_id, :reason, :payload, :trace_id, presence: true

  def approve!(actor:, reason:)
    raise ArgumentError, "invalid transition from #{status} to approved" unless requested?
    raise ArgumentError, "requester cannot approve replay" if requested_by_id == actor.id

    update!(status: :approved, approved_by: actor, approval_reason: reason, approved_at: Time.current)
  end

  def execute!(actor:, reason:, outbox_event_id:)
    raise ArgumentError, "invalid transition from #{status} to executed" unless approved?

    update!(
      status: :executed,
      executed_by: actor,
      execution_reason: reason,
      executed_at: Time.current,
      outbox_event_id: outbox_event_id
    )
  end

  private

  def apply_default_expiration
    self.expires_at ||= Rails.application.config.x.dlq_replay_request_retention_days.days.from_now
  end
end
