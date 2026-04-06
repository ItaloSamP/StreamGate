class JobSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      upload_id: record.upload_id,
      requested_by_id: record.requested_by_id,
      source_type: record.source_type,
      status: record.status,
      error_code: record.error_code,
      error_category: record.error_category,
      quarantined_records_count: record.quarantined_records_count,
      trace_id: record.trace_id,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end
end
