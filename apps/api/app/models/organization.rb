class Organization < ApplicationRecord
  include PrefixedId

  prefixed_id_with "org"

  STATUSES = {
    active: "active",
    suspended: "suspended"
  }.freeze

  DEFAULT_QUOTAS = {
    "max_file_bytes" => 10.gigabytes,
    "monthly_upload_bytes" => 1.terabyte,
    "connector_runs_daily" => 1_000,
    "retention_days" => 90
  }.freeze

  enum :status, STATUSES, default: :active, validate: true

  has_many :organization_memberships, dependent: :restrict_with_exception
  has_many :users, through: :organization_memberships
  has_many :organization_invites, dependent: :restrict_with_exception
  has_many :oidc_providers, dependent: :restrict_with_exception
  has_many :oauth_connections, dependent: :restrict_with_exception
  has_many :organization_usage_counters, dependent: :restrict_with_exception

  before_validation :set_defaults

  validates :slug, :name, :status, presence: true
  validates :slug, uniqueness: true
  validates :retention_days, numericality: { greater_than: 0 }

  def quota(key)
    quotas.fetch(key.to_s, DEFAULT_QUOTAS.fetch(key.to_s))
  end

  private

  def set_defaults
    self.slug = name.to_s.parameterize if slug.blank? && name.present?
    self.quotas = DEFAULT_QUOTAS.merge(quotas || {})
  end
end
