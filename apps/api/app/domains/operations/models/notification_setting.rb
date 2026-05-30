class NotificationSetting < ApplicationRecord
  include PrefixedId

  prefixed_id_with "notifset"

  belongs_to :user
  has_many :webhook_deliveries, dependent: :restrict_with_exception

  before_validation :ensure_webhook_secret, if: :webhook_enabled?

  validates :user_id, uniqueness: true
  validates :webhook_url, presence: true, if: :webhook_enabled?
  validate :webhook_url_must_be_https

  attr_accessor :webhook_secret

  def self.for_user(user)
    find_or_create_by!(user: user)
  end

  private

  def ensure_webhook_secret
    return if webhook_secret_digest.present?

    self.webhook_secret = SecureRandom.hex(32)
    self.webhook_secret_digest = Digest::SHA256.hexdigest(webhook_secret)
  end

  def webhook_url_must_be_https
    return if webhook_url.blank?

    uri = URI.parse(webhook_url)
    errors.add(:webhook_url, :invalid) unless uri.is_a?(URI::HTTPS) && uri.host.present?
  rescue URI::InvalidURIError
    errors.add(:webhook_url, :invalid)
  end
end
