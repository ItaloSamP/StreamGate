class OauthConnectionSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      organization_id: record.organization_id,
      user_id: record.user_id,
      provider: record.provider,
      status: record.status,
      scopes: record.scopes,
      token_expires_at: record.token_expires_at&.iso8601,
      revoked_at: record.revoked_at&.iso8601,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end
end
