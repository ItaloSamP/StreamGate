class OperationalActionIdempotencyKey < ApplicationRecord
  include PrefixedId

  prefixed_id_with "idem"

  belongs_to :actor, class_name: "User"

  validates :key, :scope, :request_fingerprint, :response_status, :expires_at, :trace_id, presence: true
  validates :key, uniqueness: { scope: %i[actor_id scope] }

  def expired?
    expires_at <= Time.current
  end
end
