class AuditEventSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      action: record.action,
      actor_id: record.actor_id,
      auditable_type: record.auditable_type,
      auditable_id: record.auditable_id,
      request_id: record.request_id,
      trace_id: record.trace_id,
      occurred_at: record.occurred_at&.iso8601,
      metadata: OperationalPayloadSanitizer.sanitize(record.metadata),
      created_at: record.created_at&.iso8601,
      updated_at: record.updated_at&.iso8601
    }
  end
end
