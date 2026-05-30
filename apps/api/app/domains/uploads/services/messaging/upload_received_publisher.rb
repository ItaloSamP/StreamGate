module Messaging
  class UploadReceivedPublisher < ApplicationService
    def initialize(upload:, job:, producer: "api", dispatch: true)
      @upload = upload
      @job = job
      @producer = producer
      @dispatch = dispatch
    end

    def call
      event_payload = UploadReceivedEventBuilder.call(upload: upload, job: job, producer: producer)
      outbox_event = OutboxEnqueueEventService.call(
        event_name: event_payload[:event_name],
        routing_key: Rails.application.config.x.broker_upload_received_routing_key,
        payload: event_payload,
        headers: {
          "x-event-name" => event_payload[:event_name],
          "x-payload-version" => event_payload[:payload_version]
        },
        trace_id: event_payload[:trace_id],
        request_id: event_payload[:request_id]
      )

      OutboxDispatchEventService.call(event_id: outbox_event.id) if dispatch

      event_payload.merge(outbox_id: outbox_event.id)
    end

    private

    attr_reader :upload, :job, :producer, :dispatch
  end
end
