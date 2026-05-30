class ConnectorProfile < ApplicationRecord
  include PrefixedId

  prefixed_id_with "conn"

  KINDS = {
    s3: "s3",
    http: "http",
    google_drive: "google_drive",
    oauth_delegated: "oauth_delegated"
  }.freeze

  STATUSES = {
    active: "active",
    disabled: "disabled"
  }.freeze

  encrypts :secret_payload

  enum :kind, KINDS, validate: true
  enum :status, STATUSES, default: :active, validate: true

  belongs_to :created_by, class_name: "User"
  has_many :connector_ingestions, dependent: :restrict_with_exception
  has_many :connector_leases, dependent: :restrict_with_exception

  validates :organization_id, :name, :settings, :secret_payload, :trace_id, presence: true

  def secrets
    JSON.parse(secret_payload.presence || "{}")
  rescue JSON::ParserError
    {}
  end

  def secrets=(value)
    self.secret_payload = (value || {}).to_json
  end
end
