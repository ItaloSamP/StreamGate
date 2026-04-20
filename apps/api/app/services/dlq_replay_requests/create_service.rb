module DlqReplayRequests
  class CreateService < ApplicationService
    REQUIRED_FIELDS = %w[event_id event_name upload_id job_id trace_id payload].freeze

    Result = Struct.new(:request, :reason, keyword_init: true) do
      def success?
        reason.nil?
      end
    end

    def initialize(actor:, message_id:, reason:, payload:)
      @actor = actor
      @message_id = message_id
      @reason = reason
      @payload = payload.to_h.deep_stringify_keys
    end

    def call
      return Result.new(reason: :invalid_payload) unless valid_payload?

      request = DlqReplayRequest.create!(
        message_id: message_id,
        requested_by: actor,
        reason: reason,
        payload: OperationalPayloadSanitizer.sanitize(payload),
        trace_id: payload.fetch("trace_id"),
        request_id: Current.request_id || payload["request_id"]
      )

      AuditEvent.create!(
        actor: actor,
        auditable: request,
        action: "dlq_replay.requested",
        metadata: { reason: reason, message_id: message_id, event_id: payload["event_id"] },
        occurred_at: Time.current,
        request_id: Current.request_id || payload["request_id"] || payload["trace_id"],
        trace_id: Current.trace_id || payload["trace_id"]
      )

      Result.new(request: request)
    end

    private

    attr_reader :actor, :message_id, :reason, :payload

    def valid_payload?
      REQUIRED_FIELDS.all? { |field| payload[field].present? } &&
        payload["event_name"] == Messaging::UploadReceivedEventBuilder::EVENT_NAME
    end
  end
end
