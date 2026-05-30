module Realtime
  class EventPublisher
    def self.call(**kwargs)
      new(**kwargs).call
    rescue ActiveRecord::ActiveRecordError => e
      Rails.logger.warn("failed to persist realtime event error=#{e.class.name}")
      nil
    end

    def initialize(event_type:, organization_id:, resource_type: nil, resource_id: nil, actor_id: nil, severity: "info", payload: {}, occurred_at: Time.current, request_id: Current.request_id, trace_id: Current.trace_id)
      @event_type = event_type
      @organization_id = organization_id
      @resource_type = resource_type
      @resource_id = resource_id
      @actor_id = actor_id
      @severity = severity
      @payload = payload
      @occurred_at = occurred_at
      @request_id = request_id
      @trace_id = trace_id
    end

    def call
      event = RealtimeEvent.create!(
        event_type: event_type,
        organization_id: organization_id,
        resource_type: resource_type,
        resource_id: resource_id,
        actor_id: actor_id,
        severity: severity,
        payload: payload,
        occurred_at: occurred_at,
        request_id: request_id,
        trace_id: trace_id
      )
      broadcast(event)
      event
    end

    private

    attr_reader :event_type, :organization_id, :resource_type, :resource_id, :actor_id, :severity, :payload, :occurred_at, :request_id, :trace_id

    def broadcast(event)
      ActionCable.server.broadcast("org:#{event.organization_id}:realtime", RealtimeEventSerializer.new(event).serializable_hash)
    rescue StandardError => e
      Rails.logger.warn("failed to broadcast realtime event id=#{event.id} error=#{e.class.name}")
    end
  end
end
