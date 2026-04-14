class OutboxDispatchPendingService < ApplicationService
  Result = Struct.new(:dispatched, :failed, keyword_init: true)

  def initialize(limit: 100, publisher: Messaging::RabbitPublisher.new)
    @limit = limit
    @publisher = publisher
  end

  def call
    dispatched = 0
    failed = 0

    IntegrationOutboxEvent.ready.limit(limit).pluck(:id).each do |event_id|
      result = OutboxDispatchEventService.call(event_id: event_id, publisher: publisher)
      if result.dispatched
        dispatched += 1
      else
        failed += 1
      end
    end

    Result.new(dispatched: dispatched, failed: failed)
  end

  private

  attr_reader :limit, :publisher
end

module Outbox
  DispatchPendingService = OutboxDispatchPendingService
end
