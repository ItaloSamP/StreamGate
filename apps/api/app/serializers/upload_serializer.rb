class UploadSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      filename: record.filename,
      content_type: record.content_type,
      byte_size: record.byte_size,
      checksum_sha256: record.checksum_sha256,
      storage_key: record.storage_key,
      status: record.status,
      sensitivity_level: record.sensitivity_level,
      user_id: record.user_id,
      trace_id: record.trace_id,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end
end
