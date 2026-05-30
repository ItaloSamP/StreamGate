class MfaChallenge < ApplicationRecord
  include PrefixedId

  prefixed_id_with "mfach"

  TTL = 5.minutes

  belongs_to :user

  validates :token_digest, :expires_at, presence: true

  def self.issue!(user:)
    raw_token = Auth::TokenService.generate
    challenge = create!(
      user: user,
      token_digest: Auth::TokenService.digest(raw_token),
      expires_at: TTL.from_now
    )
    [ challenge, raw_token ]
  end

  def usable?
    verified_at.nil? && expires_at.future?
  end
end
