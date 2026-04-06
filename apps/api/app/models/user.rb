class User < ApplicationRecord
  include PrefixedId

  prefixed_id_with "user"

  ROLES = {
    operator: "operator",
    admin: "admin",
    service_account: "service_account"
  }.freeze

  STATUSES = {
    invited: "invited",
    active: "active",
    suspended: "suspended"
  }.freeze

  enum :role, ROLES, default: :operator, validate: true
  enum :status, STATUSES, default: :invited, validate: true

  has_many :uploads, dependent: :restrict_with_exception
  has_many :requested_jobs, class_name: "Job", foreign_key: :requested_by_id, inverse_of: :requested_by, dependent: :restrict_with_exception
  has_many :processing_attempts, foreign_key: :initiated_by_id, inverse_of: :initiated_by, dependent: :nullify
  has_many :audit_events, foreign_key: :actor_id, inverse_of: :actor, dependent: :nullify

  normalizes :email, with: ->(value) { value.to_s.strip.downcase }

  validates :email, presence: true, uniqueness: true,
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :full_name, presence: true
end
