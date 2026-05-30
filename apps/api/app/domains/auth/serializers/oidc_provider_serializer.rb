class OidcProviderSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      organization_id: record.organization_id,
      provider: record.provider,
      issuer: record.issuer,
      client_id: record.client_id,
      hosted_domain: record.hosted_domain,
      scopes: record.scopes,
      status: record.status,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end
end
