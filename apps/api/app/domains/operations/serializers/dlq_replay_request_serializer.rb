class DlqReplayRequestSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      message_id: record.message_id,
      status: record.status,
      requested_by_id: record.requested_by_id,
      approved_by_id: record.approved_by_id,
      executed_by_id: record.executed_by_id,
      reason: record.reason,
      approval_reason: record.approval_reason,
      execution_reason: record.execution_reason,
      approved_at: record.approved_at&.iso8601,
      executed_at: record.executed_at&.iso8601,
      expires_at: record.expires_at&.iso8601,
      outbox_event_id: record.outbox_event_id,
      trace_id: record.trace_id,
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end
end
