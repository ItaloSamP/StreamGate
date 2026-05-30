class OutboxDispatchEventService < ApplicationService
  DEFAULT_BACKOFF_SECONDS = 5
  MAX_BACKOFF_SECONDS = 300

  Result = Struct.new(:event, :dispatched, :error, keyword_init: true)

  def initialize(event_id:, publisher: Messaging::RabbitPublisher.new)
    @event_id = event_id
    @publisher = publisher
  end

  def call
    event = IntegrationOutboxEvent.find_by(id: event_id)
    return Result.new(event: nil, dispatched: false, error: nil) if event.nil?
    return Result.new(event: event, dispatched: true, error: nil) if event.dispatched?

    publisher.publish!(
      routing_key: event.routing_key,
      payload: event.payload.deep_symbolize_keys,
      headers: event.headers
    )

    event.update!(
      status: :dispatched,
      attempts_count: event.attempts_count + 1,
      dispatched_at: Time.current,
      available_at: Time.current,
      last_error: nil
    )

    Result.new(event: event, dispatched: true, error: nil)
  rescue StandardError => error
    if event
      attempts = event.attempts_count + 1
      event.update!(
        status: :pending,
        attempts_count: attempts,
        last_error: error.message.to_s.first(500),
        available_at: Time.current + next_backoff(attempts)
      )
    end

    Result.new(event: event, dispatched: false, error: error)
  end

  private

  attr_reader :event_id, :publisher

  def next_backoff(attempts)
    [ DEFAULT_BACKOFF_SECONDS * (2**[ attempts - 1, 0 ].max), MAX_BACKOFF_SECONDS ].min
  end
end

module Outbox
  DispatchEventService = OutboxDispatchEventService
end
