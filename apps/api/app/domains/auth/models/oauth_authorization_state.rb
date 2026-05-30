class OauthAuthorizationState < ApplicationRecord
  include PrefixedId

  prefixed_id_with "oauths"

  TTL = 10.minutes

  belongs_to :organization
  belongs_to :user

  validates :provider, :state_digest, :expires_at, presence: true

  def self.issue!(organization:, user:, provider:, scopes:)
    raw_state = Auth::TokenService.generate
    state = create!(
      organization: organization,
      user: user,
      provider: provider,
      state_digest: Auth::TokenService.digest(raw_state),
      scopes: scopes,
      expires_at: TTL.from_now
    )
    [ state, raw_state ]
  end

  def usable?
    consumed_at.nil? && expires_at.future?
  end
end
