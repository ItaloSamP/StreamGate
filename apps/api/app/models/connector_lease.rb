require "digest"
require "securerandom"

class ConnectorLease < ApplicationRecord
  include PrefixedId

  prefixed_id_with "lease"

  STATUSES = {
    pending: "pending",
    claimed: "claimed",
    expired: "expired"
  }.freeze

  enum :status, STATUSES, default: :pending, validate: true

  belongs_to :connector_profile
  belongs_to :connector_ingestion

  validates :token_digest, :expires_at, :trace_id, presence: true

  def self.create_with_token!(connector_profile:, connector_ingestion:, request_id:, trace_id:)
    token = SecureRandom.urlsafe_base64(32)
    lease = create!(
      connector_profile: connector_profile,
      connector_ingestion: connector_ingestion,
      token_digest: digest(token),
      expires_at: Rails.application.config.x.connector_lease_ttl_seconds.seconds.from_now,
      request_id: request_id,
      trace_id: trace_id
    )
    [ lease, token ]
  end

  def self.digest(token)
    Digest::SHA256.hexdigest(token.to_s)
  end

  def claim!(token:, claimed_by:)
    return false unless pending?
    return false if expires_at <= Time.current
    candidate = self.class.digest(token)
    return false unless candidate.bytesize == token_digest.bytesize && ActiveSupport::SecurityUtils.secure_compare(token_digest, candidate)

    update!(status: "claimed", claimed_at: Time.current, claimed_by: claimed_by)
  end
end
