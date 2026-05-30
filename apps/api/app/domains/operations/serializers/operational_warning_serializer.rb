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
      organization_id: record.organization_id,
      reviewed_by_id: record.reviewed_by_id,
      reviewed_at: record.reviewed_at&.iso8601,
      review_reason: record.review_reason,
      dismissed_by_id: record.dismissed_by_id,
      dismissed_at: record.dismissed_at&.iso8601,
      dismiss_reason: record.dismiss_reason,
      resolved_at: record.resolved_at&.iso8601,
      expires_at: record.expires_at&.iso8601,
      trace_id: record.trace_id,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end
end
