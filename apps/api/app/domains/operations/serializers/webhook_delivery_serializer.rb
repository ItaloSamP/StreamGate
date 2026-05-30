class WebhookDeliverySerializer < ApplicationSerializer
  def serializable_hash
    {
      id: record.id,
      notification_id: record.notification_id,
      channel: record.channel,
      event_name: record.event_name,
      status: record.status,
      attempts_count: record.attempts_count,
      next_attempt_at: record.next_attempt_at&.iso8601,
      delivered_at: record.delivered_at&.iso8601,
      response_status: record.response_status,
      trace_id: record.trace_id,
      created_at: record.created_at&.iso8601,
      webhook_secret: nil
    }
  end
end
