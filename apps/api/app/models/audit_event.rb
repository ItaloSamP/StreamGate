class AuditEvent < ApplicationRecord
  include PrefixedId

  prefixed_id_with "audit"

  before_validation :sanitize_metadata

  belongs_to :actor, class_name: "User", optional: true, inverse_of: :audit_events
  belongs_to :auditable, polymorphic: true

  validates :action, :occurred_at, :request_id, :trace_id, presence: true

  private

  def sanitize_metadata
    self.metadata = Audit::MetadataSanitizer.sanitize(metadata)
  end
end
