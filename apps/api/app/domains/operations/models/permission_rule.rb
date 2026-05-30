class PermissionRule < ApplicationRecord
  include PrefixedId

  prefixed_id_with "perm"

  validates :role, :capability, presence: true
  validates :capability, uniqueness: { scope: %i[organization_id role] }
end
