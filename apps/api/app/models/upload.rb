class Upload < ApplicationRecord
  include PrefixedId

  prefixed_id_with "upload"

  STATUSES = {
    registered: "registered",
    stored: "stored",
    processing: "processing",
    completed: "completed",
    failed: "failed",
    quarantined: "quarantined"
  }.freeze

  SENSITIVITY_LEVELS = {
    internal: "internal",
    restricted: "restricted"
  }.freeze

  enum :status, STATUSES, default: :registered, validate: true
  enum :sensitivity_level, SENSITIVITY_LEVELS, default: :internal, validate: true

  belongs_to :user
  has_many :jobs, dependent: :restrict_with_exception
  has_many :audit_events, as: :auditable, dependent: :restrict_with_exception
  has_many :analytics_job_snapshots, dependent: :restrict_with_exception

  validates :filename, :content_type, :storage_key, :checksum_sha256, :trace_id, presence: true
  validates :byte_size, numericality: { greater_than: 0 }
  validates :checksum_sha256, format: { with: /\A[a-f0-9]{64}\z/ }
  validates :storage_key, uniqueness: true
end
