module DlqReplayRequests
  class ApproveService < ApplicationService
    Result = Struct.new(:request, :reason, keyword_init: true) do
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
      return Result.new(reason: :self_approval) if request.requested_by_id == actor.id
      return Result.new(reason: :invalid_state) unless request.requested?

      request.approve!(actor: actor, reason: reason)
      AuditEvent.create!(
        actor: actor,
        auditable: request,
        action: "dlq_replay.approved",
        metadata: { reason: reason, message_id: request.message_id },
        occurred_at: Time.current,
        request_id: Current.request_id || request.request_id || request.trace_id,
        trace_id: Current.trace_id || request.trace_id
      )
      Result.new(request: request)
    rescue ArgumentError
      Result.new(reason: :invalid_state)
    end

    private

    attr_reader :request, :actor, :reason
  end
end
