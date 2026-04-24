class UploadAcquisitionSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      upload_id: record.upload_id,
      job_id: record.job_id,
      source_type: record.source_type,
      link_mode: record.link_mode,
      status: record.status,
      url_masked: record.url_masked,
      url_hash: record.url_hash,
      source_host: record.source_host,
      content_type: record.content_type,
      byte_size: record.byte_size,
      requested_at: record.requested_at&.iso8601,
      completed_at: record.completed_at&.iso8601,
      trace_id: record.trace_id,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end
end
