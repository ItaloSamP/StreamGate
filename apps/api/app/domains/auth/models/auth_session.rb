class AuthSession < ApplicationRecord
  include PrefixedId

  prefixed_id_with "sess"

  belongs_to :user

  validates :token_digest, :expires_at, :trace_id, presence: true

  scope :active, -> { where(revoked_at: nil).where("expires_at > ?", Time.current) }

  def expired?
    expires_at <= Time.current
  end

  def revoked?
    revoked_at.present?
  end

  def active?
    !expired? && !revoked?
  end

  def revoke!
    update!(revoked_at: Time.current)
  end
end
