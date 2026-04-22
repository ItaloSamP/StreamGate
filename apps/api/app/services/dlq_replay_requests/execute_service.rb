module DlqReplayRequests
  class ExecuteService < ApplicationService
    Result = Struct.new(:request, :outbox_event, :reason, keyword_init: true) do
      def success?
        reason.nil?
      end
    end

    def initialize(request:, actor:, reason:)
      @request = request
      @actor = actor
      @reason = reason
    end

    def call
      return Result.new(reason: :invalid_state) unless request.approved?

      ApplicationRecord.transaction do
        outbox = OutboxEnqueueEventService.call(
          event_name: request.payload.fetch("event_name"),
          routing_key: Rails.application.config.x.broker_upload_received_routing_key,
          payload: replay_payload,
          headers: {
            "x-event-name" => request.payload.fetch("event_name"),
            "x-replay-request-id" => request.id
          },
          trace_id: request.trace_id,
          request_id: Current.request_id || request.request_id
        )
        request.execute!(actor: actor, reason: reason, outbox_event_id: outbox.id)
        AuditEvent.create!(
          actor: actor,
          auditable: request,
          action: "dlq_replay.executed",
          metadata: { reason: reason, outbox_id: outbox.id, message_id: request.message_id },
          occurred_at: Time.current,
          request_id: Current.request_id || request.request_id || request.trace_id,
          trace_id: Current.trace_id || request.trace_id
        )
        Result.new(request: request, outbox_event: outbox)
      end
    rescue KeyError, ArgumentError => error
      request.update!(status: :failed, last_error: error.message) if request.persisted?
      Result.new(reason: :invalid_payload)
    end

    private

    attr_reader :request, :actor, :reason

    def replay_payload
      payload = request.payload.deep_symbolize_keys
      payload[:event_id] = StreamGate::Id.generate("event")
      payload[:producer] = "api.dlq_replay"
      payload[:occurred_at] = Time.current.iso8601
      payload
    end
  end
end
