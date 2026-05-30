class MfaFactor < ApplicationRecord
  include PrefixedId

  prefixed_id_with "mfa"

  FACTOR_TYPES = {
    totp: "totp"
  }.freeze

  STATUSES = {
    pending: "pending",
    enabled: "enabled",
    disabled: "disabled"
  }.freeze

  encrypts :secret_ciphertext

  enum :factor_type, FACTOR_TYPES, default: :totp, validate: true
  enum :status, STATUSES, default: :pending, validate: true

  belongs_to :user

  validates :secret_ciphertext, presence: true

  def enable!(recovery_codes:)
    update!(
      status: "enabled",
      enabled_at: Time.current,
      last_verified_at: Time.current,
      recovery_code_digests: recovery_codes.map { |code| Auth::TokenService.digest(code) }
    )
  end

  def verify_code?(code)
    Auth::TotpService.verify?(secret_ciphertext, code)
  end
end
