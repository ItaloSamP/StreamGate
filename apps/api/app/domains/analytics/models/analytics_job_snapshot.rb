class AnalyticsJobSnapshot < ApplicationRecord
  include PrefixedId

  prefixed_id_with "ajs"

  belongs_to :job
  belongs_to :upload
  belongs_to :actor, class_name: "User"

  validates :organization_id, :source_type, :status, :job_created_at, :last_synced_at, presence: true
  validates :job_id, uniqueness: true
end
