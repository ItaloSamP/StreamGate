class OauthConnection < ApplicationRecord
  include PrefixedId

  prefixed_id_with "oauth"

  PROVIDERS = {
    google_drive: "google_drive"
  }.freeze

  STATUSES = {
    active: "active",
    revoked: "revoked",
    expired: "expired"
  }.freeze

  DRIVE_SCOPES = %w[openid email profile https://www.googleapis.com/auth/drive].freeze

  encrypts :refresh_token_ciphertext

  enum :provider, PROVIDERS, default: :google_drive, validate: true
  enum :status, STATUSES, default: :active, validate: true

  belongs_to :organization
  belongs_to :user

  validates :organization_id, uniqueness: { scope: [ :user_id, :provider ] }

  def revoke!
    update!(status: "revoked", revoked_at: Time.current, refresh_token_ciphertext: nil)
  end
end
