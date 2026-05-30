class OrganizationUsageCounter < ApplicationRecord
  include PrefixedId

  prefixed_id_with "ouc"

  belongs_to :organization

  validates :period_start, presence: true
  validates :organization_id, uniqueness: { scope: :period_start }
end
