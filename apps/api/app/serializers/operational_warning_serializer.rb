class OperationalWarningSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      job_id: record.job_id,
      upload_id: record.upload_id,
      code: record.code,
      message: record.message,
      status: record.status,
      severity: record.severity,
      retry_count: record.retry_count,
      resolved_at: record.resolved_at&.iso8601,
      expires_at: record.expires_at&.iso8601,
      trace_id: record.trace_id,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end
end
