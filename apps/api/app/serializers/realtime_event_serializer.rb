class RealtimeEventSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      event_type: record.event_type,
      organization_id: record.organization_id,
      actor_id: record.actor_id,
      resource_type: record.resource_type,
      resource_id: record.resource_id,
      severity: record.severity,
      payload: Operational::PayloadMasker.call(record.payload || {}),
      occurred_at: record.occurred_at&.iso8601,
      expires_at: record.expires_at&.iso8601,
      trace_id: record.trace_id,
      request_id: record.request_id
    }
  end
end
