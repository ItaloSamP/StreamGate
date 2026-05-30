module Jobs
  class RetryService < ApplicationService
    Result = Struct.new(:job, :attempt, :outbox_event, :reason, keyword_init: true) do
      def success?
        reason.nil?
      end
    end

    ALLOWED_STATUSES = %w[failed quarantined_with_warnings].freeze

    def initialize(job:, actor:, reason:)
      @job = job
      @actor = actor
      @reason = reason
    end

    def call
      return Result.new(reason: :invalid_state) unless ALLOWED_STATUSES.include?(job.status)
      return Result.new(reason: :cooldown_active) if cooldown_active?
      return Result.new(reason: :daily_limit_exceeded) if daily_limit_exceeded?

      ApplicationRecord.transaction do
        attempt = job.processing_attempts.create!(
          attempt_number: next_attempt_number,
          operation: "manual_retry",
          initiated_by: actor,
          trace_id: Current.trace_id || job.trace_id,
          request_id: Current.request_id,
          metadata: { reason: reason }
        )

        outbox_payload = Messaging::UploadReceivedPublisher.call(upload: job.upload, job: job, producer: "api.manual_retry", dispatch: false)
        audit!("job.retry_requested", job, { reason: reason, attempt_id: attempt.id, outbox_id: outbox_payload[:outbox_id] })
        Notifications::EmitService.call(
          recipient: job.requested_by,
          event_name: "job.retry_requested",
          title: "Retry solicitado",
          body: "Um retry operacional foi solicitado para o job #{job.id}.",
          metadata: { job_id: job.id, reason: reason },
          trace_id: Current.trace_id || job.trace_id,
          request_id: Current.request_id
        )

        Result.new(job: job, attempt: attempt, outbox_event: IntegrationOutboxEvent.find(outbox_payload[:outbox_id]))
      end
    end

    private

    attr_reader :job, :actor, :reason

    def next_attempt_number
      job.processing_attempts.maximum(:attempt_number).to_i + 1
    end

    def cooldown_active?
      AuditEvent.where(actor: actor, action: "job.retry_requested", auditable: job)
        .where("occurred_at >= ?", Rails.application.config.x.operational_action_cooldown_seconds.seconds.ago)
        .exists?
    end

    def daily_limit_exceeded?
      AuditEvent.where(actor: actor, action: "job.retry_requested")
        .where("occurred_at >= ?", 1.day.ago)
        .count >= Rails.application.config.x.operational_action_daily_limit
    end

    def audit!(action, auditable, metadata)
      AuditEvent.create!(
        actor: actor,
        auditable: auditable,
        action: action,
        metadata: metadata,
        occurred_at: Time.current,
        request_id: Current.request_id || job.request_id || job.trace_id,
        trace_id: Current.trace_id || job.trace_id
      )
    end
  end
end
