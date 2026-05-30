class OidcProvider < ApplicationRecord
  include PrefixedId

  prefixed_id_with "oidcp"

  PROVIDERS = {
    google_workspace: "google_workspace"
  }.freeze

  STATUSES = {
    active: "active",
    disabled: "disabled"
  }.freeze

  GOOGLE_SCOPES = %w[openid email profile].freeze

  encrypts :client_secret_ciphertext

  enum :provider, PROVIDERS, default: :google_workspace, validate: true
  enum :status, STATUSES, default: :active, validate: true

  belongs_to :organization

  validates :issuer, :client_id, :client_secret_ciphertext, :hosted_domain, presence: true
end
