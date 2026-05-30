class NotificationSerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      event_name: record.event_name,
      title: record.title,
      body: record.body,
      status: record.status,
      read_at: record.read_at&.iso8601,
      expires_at: record.expires_at&.iso8601,
      metadata: OperationalPayloadSanitizer.sanitize(record.metadata),
      trace_id: record.trace_id,
      created_at: record.created_at&.iso8601
    }
  end
end
