class OrganizationInvite < ApplicationRecord
  include PrefixedId

  prefixed_id_with "oinv"

  STATUSES = {
    pending: "pending",
    accepted: "accepted",
    revoked: "revoked",
    expired: "expired"
  }.freeze

  TOKEN_TTL = 7.days

  enum :status, STATUSES, default: :pending, validate: true
  enum :role, OrganizationMembership::ROLES, default: :operator, validate: true

  belongs_to :organization
  belongs_to :invited_by, class_name: "User"
  belongs_to :accepted_by, class_name: "User", optional: true

  normalizes :email, with: ->(value) { value.to_s.strip.downcase }

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :token_digest, :expires_at, presence: true

  def self.issue!(organization:, email:, role:, invited_by:)
    raw_token = Auth::TokenService.generate
    invite = create!(
      organization: organization,
      email: email,
      role: role,
      invited_by: invited_by,
      token_digest: Auth::TokenService.digest(raw_token),
      expires_at: TOKEN_TTL.from_now
    )
    [ invite, raw_token ]
  end

  def accept!(user)
    transaction do
      update!(status: "accepted", accepted_by: user, accepted_at: Time.current)
      OrganizationMembership.create!(
        organization: organization,
        user: user,
        role: role,
        status: "active",
        invited_by: invited_by,
        joined_at: Time.current
      )
      user.update!(organization_id: organization_id, role: role, status: "active")
    end
  end

  def expired_for_acceptance?
    !pending? || expires_at.past?
  end
end
