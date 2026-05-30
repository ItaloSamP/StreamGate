class OrganizationSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      slug: record.slug,
      name: record.name,
      status: record.status,
      quotas: record.quotas,
      retention_days: record.retention_days,
      compliance_profile: record.compliance_profile,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end
end
