class UserSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      email: record.email,
      full_name: record.full_name,
      role: record.role,
      status: record.status,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end
end
