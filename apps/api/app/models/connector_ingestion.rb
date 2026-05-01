class ConnectorIngestion < ApplicationRecord
  include PrefixedId

  prefixed_id_with "cing"

  STATUSES = {
    pending: "pending",
    leased: "leased",
    fetching: "fetching",
    stored: "stored",
    failed: "failed"
  }.freeze

  enum :status, STATUSES, default: :pending, validate: true

  belongs_to :connector_profile
  belongs_to :upload
  belongs_to :job
  belongs_to :requested_by, class_name: "User"
  has_one :connector_lease, dependent: :restrict_with_exception

  validates :filename, :content_type, :trace_id, presence: true
end
