class AuthSessionSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      user_id: record.user_id,
      expires_at: record.expires_at&.iso8601,
      revoked_at: record.revoked_at&.iso8601,
      last_seen_at: record.last_seen_at&.iso8601,
      trace_id: record.trace_id,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end
end
