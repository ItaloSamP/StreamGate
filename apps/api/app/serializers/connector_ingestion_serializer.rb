class ConnectorIngestionSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      connector_profile_id: record.connector_profile_id,
      upload_id: record.upload_id,
      job_id: record.job_id,
      requested_by_id: record.requested_by_id,
      status: record.status,
      object_key: masked(record.object_key),
      source_path: masked(record.source_path),
      filename: record.filename,
      content_type: record.content_type,
      byte_size: record.byte_size,
      trace_id: record.trace_id,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end

  private

  def masked(value)
    return nil if value.blank?

    value.to_s.gsub(%r{(?<=.{4}).(?=.{4})}, "*")
  end
end
