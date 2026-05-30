# frozen_string_literal: true

require "time"

module Worker
  module Runtime
    class ConnectorRequestedProcessor
      def initialize(config:, storage_client:, logger:, lease_client: nil, fetcher: nil, scanner: nil)
        @config = config
        @storage_client = storage_client
        @logger = logger
        @lease_client = lease_client || ConnectorLeaseClient.new(config: config)
        @fetcher = fetcher || ConnectorFetcher.new
        @scanner = scanner || MalwareScanner.new(config: config)
      end

      def process(event, retry_count:)
        logger.debug("connector ingestion retry_count=#{retry_count}") if retry_count.to_i.positive?
        validate_event!(event)
        ids = event_identifiers(event)
        payload = event.fetch("payload")
        lease_data = lease_client.claim(lease_id: payload.fetch("lease_id"))
        result = fetcher.call(connector: lease_data.fetch("connector"), ingestion: lease_data.fetch("ingestion"))
        scan_result = scanner.scan_io(result.io)
        raise TerminalProcessingError, "connector_malware_detected" if scan_result.infected?

        storage_key = lease_data.fetch("ingestion").fetch("storage_key")
        storage_client.write_object_stream(storage_key: storage_key, io: result.io, content_type: result.content_type)

        {
          publish: {
            routing_key: config.routing_key,
            payload: upload_received_event(ids, storage_key, result)
          }
        }
      rescue TransientProcessingError
        raise
      rescue TerminalProcessingError
        raise
      rescue KeyError => e
        raise TerminalProcessingError, "connector_payload_missing_key: #{e.message}"
      ensure
        close_result_io(result&.io)
      end

      private

      attr_reader :config, :storage_client, :logger, :lease_client, :fetcher, :scanner

      def validate_event!(event)
        required = %w[event_id event_name payload upload_id job_id trace_id]
        missing = required.reject { |key| event.key?(key) }
        raise TerminalProcessingError, "missing_required_fields=#{missing.join(",")}" if missing.any?
        raise TerminalProcessingError, "invalid_event_name=#{event["event_name"]}" unless event["event_name"] == "connector.ingestion.requested.v1"
      end

      def event_identifiers(event)
        {
          event_id: event["event_id"],
          event_name: event["event_name"],
          job_id: event["job_id"],
          upload_id: event["upload_id"],
          trace_id: event["trace_id"],
          request_id: event["request_id"] || event["trace_id"],
          correlation_id: event["correlation_id"] || event["request_id"] || event["trace_id"]
        }
      end

      def upload_received_event(ids, storage_key, result)
        {
          event_id: Worker::Id.generate("event"),
          event_name: "upload.received.v1",
          occurred_at: Time.now.utc.iso8601,
          producer: "worker.connector",
          payload_version: 1,
          correlation_id: ids[:correlation_id],
          trace_id: ids[:trace_id],
          request_id: ids[:request_id],
          upload_id: ids[:upload_id],
          job_id: ids[:job_id],
          payload: {
            storage_key: storage_key,
            checksum_sha256: result.checksum_sha256,
            content_type: result.content_type,
            byte_size: result.byte_size
          }
        }
      end

      def close_result_io(io)
        return if io.nil?

        if io.respond_to?(:close!)
          io.close!
        elsif io.respond_to?(:close)
          io.close
        end
      end
    end
  end
end
