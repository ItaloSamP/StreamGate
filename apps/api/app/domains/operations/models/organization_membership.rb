class OrganizationMembership < ApplicationRecord
  include PrefixedId

  prefixed_id_with "omem"

  ROLES = {
    admin: "admin",
    operator: "operator"
  }.freeze

  STATUSES = {
    invited: "invited",
    active: "active",
    suspended: "suspended"
  }.freeze

  enum :role, ROLES, default: :operator, validate: true
  enum :status, STATUSES, default: :active, validate: true

  belongs_to :organization
  belongs_to :user
  belongs_to :invited_by, class_name: "User", optional: true

  validates :organization_id, uniqueness: { scope: :user_id }
end
