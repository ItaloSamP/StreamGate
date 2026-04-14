class QuarantineRecordSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      job_id: record.job_id,
      job_batch_id: record.job_batch_id,
      severity: record.severity,
      code: record.code,
      message: record.message,
      row_number: record.row_number,
      payload: record.payload,
      trace_id: record.trace_id,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end
end
