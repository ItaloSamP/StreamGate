class OidcLoginState < ApplicationRecord
  include PrefixedId

  prefixed_id_with "oidcs"

  TTL = 10.minutes

  belongs_to :organization
  belongs_to :oidc_provider

  validates :state_digest, :nonce, :expires_at, presence: true

  def self.issue!(organization:, oidc_provider:, redirect_uri: nil)
    raw_state = Auth::TokenService.generate
    nonce = SecureRandom.urlsafe_base64(24)
    state = create!(
      organization: organization,
      oidc_provider: oidc_provider,
      state_digest: Auth::TokenService.digest(raw_state),
      nonce: nonce,
      redirect_uri: redirect_uri,
      expires_at: TTL.from_now
    )
    [ state, raw_state ]
  end

  def usable?
    consumed_at.nil? && expires_at.future?
  end
end
