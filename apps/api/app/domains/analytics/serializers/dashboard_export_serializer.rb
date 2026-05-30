class DashboardExportSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      organization_id: record.organization_id,
      actor_id: record.actor_id,
      kind: record.kind,
      format: record.format,
      filename: record.filename,
      content_type: record.content_type,
      byte_size: record.byte_size,
      checksum_sha256: record.checksum_sha256,
      metadata: record.metadata,
      generated_at: record.generated_at&.iso8601,
      expires_at: record.expires_at&.iso8601,
      trace_id: record.trace_id
    }
  end
end
