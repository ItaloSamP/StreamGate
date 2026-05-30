class Notification < ApplicationRecord
  include PrefixedId

  prefixed_id_with "notification"

  STATUSES = {
    unread: "unread",
    read: "read",
    archived: "archived"
  }.freeze

  enum :status, STATUSES, default: :unread, validate: true

  belongs_to :recipient, class_name: "User"
  has_many :webhook_deliveries, dependent: :nullify

  before_validation :apply_default_expiration, on: :create

  validates :event_name, :title, :body, :trace_id, presence: true

  private

  def apply_default_expiration
    self.expires_at ||= Rails.application.config.x.notification_retention_days.days.from_now
  end
end
