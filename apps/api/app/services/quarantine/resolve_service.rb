module Quarantine
  class ResolveService < ApplicationService
    Result = Struct.new(:record, :reason, keyword_init: true) do
      def success?
        reason.nil?
      end
    end

    def initialize(record:, actor:, reason:)
      @record = record
      @actor = actor
      @reason = reason
    end

    def call
      return Result.new(reason: :invalid_state) if record.resolved?

      ApplicationRecord.transaction do
        record.resolve!(actor: actor, reason: reason)
        AuditEvent.create!(
          actor: actor,
          auditable: record,
          action: "quarantine.resolve",
          metadata: { reason: reason, job_id: record.job_id },
          occurred_at: Time.current,
          request_id: Current.request_id || record.job.request_id || record.trace_id,
          trace_id: Current.trace_id || record.trace_id
        )
        Notifications::EmitService.call(
          recipient: record.job.requested_by,
          event_name: "quarantine.resolved",
          title: "Quarentena resolvida",
          body: "Um registro de quarentena foi resolvido para o job #{record.job_id}.",
          metadata: { quarantine_id: record.id, job_id: record.job_id, reason: reason },
          trace_id: Current.trace_id || record.trace_id,
          request_id: Current.request_id
        )
      end

      Result.new(record: record)
    end

    private

    attr_reader :record, :actor, :reason
  end
end
