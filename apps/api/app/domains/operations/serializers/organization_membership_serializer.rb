class OrganizationMembershipSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      organization_id: record.organization_id,
      user_id: record.user_id,
      email: record.user&.email,
      full_name: record.user&.full_name,
      role: record.role,
      status: record.status,
      joined_at: record.joined_at&.iso8601,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end
end
