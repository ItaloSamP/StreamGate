class OrganizationInviteSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      organization_id: record.organization_id,
      email: record.email,
      role: record.role,
      status: record.status,
      expires_at: record.expires_at&.iso8601,
      invited_by_id: record.invited_by_id,
      accepted_by_id: record.accepted_by_id,
      accepted_at: record.accepted_at&.iso8601,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end
end
