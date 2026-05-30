class OutboxEnqueueEventService < ApplicationService
  def initialize(event_name:, routing_key:, payload:, headers: {}, trace_id:, request_id:)
    @event_name = event_name
    @routing_key = routing_key
    @payload = payload
    @headers = headers
    @trace_id = trace_id
    @request_id = request_id
  end

  def call
    IntegrationOutboxEvent.create!(
      event_id: payload.fetch(:event_id),
      event_name: event_name,
      routing_key: routing_key,
      payload: payload,
      headers: headers,
      trace_id: trace_id,
      request_id: request_id || trace_id,
      status: :pending,
      available_at: Time.current
    )
  end

  private

  attr_reader :event_name, :routing_key, :payload, :headers, :trace_id, :request_id
end
