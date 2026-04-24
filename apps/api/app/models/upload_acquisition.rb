class UploadAcquisition < ApplicationRecord
  include PrefixedId

  prefixed_id_with "acq"

  SOURCE_TYPES = {
    external_link: "external_link"
  }.freeze

  LINK_MODES = {
    public_link: "public_link"
  }.freeze

  STATUSES = {
    pending: "pending",
    fetching: "fetching",
    stored: "stored",
    failed: "failed"
  }.freeze

  enum :source_type, SOURCE_TYPES, default: :external_link, validate: true
  enum :link_mode, LINK_MODES, default: :public_link, validate: true
  enum :status, STATUSES, default: :pending, validate: true

  belongs_to :upload
  belongs_to :job

  validates :url_hash, :url_masked, :source_host, :requested_at, :trace_id, presence: true
  validates :byte_size, numericality: { greater_than: 0 }, allow_nil: true
end
