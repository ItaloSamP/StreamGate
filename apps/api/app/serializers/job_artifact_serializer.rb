class JobArtifactSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      job_id: record.job_id,
      artifact_type: record.artifact_type,
      status: record.status,
      filename: record.filename,
      content_type: record.content_type,
      byte_size: record.byte_size,
      checksum_sha256: record.checksum_sha256,
      generated_at: record.generated_at&.iso8601,
      expires_at: record.expires_at&.iso8601,
      metadata: OperationalPayloadSanitizer.sanitize(record.metadata),
      trace_id: record.trace_id,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end
end
