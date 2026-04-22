class WebhookDelivery < ApplicationRecord
  include PrefixedId

  prefixed_id_with "delivery"

  CHANNELS = {
    email: "email",
    webhook: "webhook"
  }.freeze

  STATUSES = {
    pending: "pending",
    delivered: "delivered",
    failed: "failed"
  }.freeze

  enum :channel, CHANNELS, validate: true
  enum :status, STATUSES, default: :pending, validate: true

  belongs_to :notification, optional: true
  belongs_to :notification_setting

  validates :event_name, :trace_id, presence: true
  validates :attempts_count, numericality: { greater_than_or_equal_to: 0, only_integer: true }

  def schedule_retry!(error:)
    next_count = attempts_count + 1
    update!(
      attempts_count: next_count,
      status: next_count >= 3 ? :failed : :pending,
      last_error: error.to_s,
      next_attempt_at: Time.current + (2**next_count).minutes
    )
  end
end
