# frozen_string_literal: true

require "bunny"
require "json"
require "logger"

module Worker
  module Runtime
    class Consumer
      MAX_BACKOFF_SECONDS = 30

      def initialize(config: Config.new, logger: Logger.new($stdout))
        @config = config
        @logger = logger
        @db_client = DbClient.new(config: config)
        @storage_client = StorageClient.new(config: config)
        @parser = Processing::CsvZipParser.new
        @processor = UploadReceivedProcessor.new(
          config: config,
          db_client: db_client,
          storage_client: storage_client,
          parser: parser,
          logger: logger
        )
      end

      def run
        session = Bunny.new(
          hostname: config.broker_host,
          port: config.broker_port,
          username: config.broker_username,
          password: config.broker_password,
          vhost: config.broker_vhost,
          automatically_recover: true
        )
        session.start
        channel = session.create_channel

        exchange = channel.topic(config.exchange_name, durable: true)
        dlq = channel.queue(config.dlq_queue_name, durable: true)
        dlq.bind(exchange, routing_key: config.dlq_routing_key)

        queue = channel.queue(
          config.queue_name,
          durable: true,
          arguments: {
            "x-dead-letter-exchange" => config.exchange_name,
            "x-dead-letter-routing-key" => config.dlq_routing_key
          }
        )
        queue.bind(exchange, routing_key: config.routing_key)

        logger.info("worker consumer started queue=#{config.queue_name} routing_key=#{config.routing_key}")
        queue.subscribe(manual_ack: true, block: true) do |delivery_info, properties, payload|
          handle_message(channel, exchange, delivery_info, properties, payload)
        end
      ensure
        channel&.close if channel&.open?
        session&.close if session&.open?
      end

      private

      attr_reader :config, :logger, :processor, :db_client, :storage_client, :parser

      def handle_message(channel, exchange, delivery_info, properties, payload)
        retry_count = (properties.headers || {}).fetch("x-retry-count", 0).to_i
        started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        event = JSON.parse(payload)

        result = processor.process(event, retry_count: retry_count)
        status = result == :duplicate ? "duplicate" : "processed"

        record_metric(
          event: event,
          status: status,
          retry_count: retry_count,
          moved_to_dlq: false,
          started_at: started_at
        )
        channel.ack(delivery_info.delivery_tag)
      rescue JSON::ParserError => error
        logger.error("invalid payload json error=#{error.message}")
        publish_to_dlq(exchange, payload, "invalid_json", retry_count)
        channel.ack(delivery_info.delivery_tag)
      rescue Worker::TransientProcessingError => error
        if retry_count < config.max_retries
          next_retry = retry_count + 1
          backoff_seconds = exponential_backoff(next_retry)
          sleep(backoff_seconds)

          exchange.publish(
            payload,
            routing_key: config.routing_key,
            content_type: "application/json",
            persistent: true,
            headers: {
              "x-retry-count" => next_retry,
              "x-last-error" => error.class.name,
              "x-backoff-seconds" => backoff_seconds
            }
          )
          logger.warn("message retried event_id=#{event && event['event_id']} count=#{next_retry} backoff=#{backoff_seconds}s")
          record_metric(
            event: event,
            status: "retried",
            retry_count: next_retry,
            moved_to_dlq: false,
            error_code: "transient_processing_error",
            error_class: error.class.name,
            started_at: started_at
          )
        else
          publish_to_dlq(exchange, payload, "max_retries_exceeded", retry_count)
          logger.error("message moved to dlq event_id=#{event && event['event_id']} retries=#{retry_count}")
          record_metric(
            event: event,
            status: "dlq",
            retry_count: retry_count,
            moved_to_dlq: true,
            error_code: "max_retries_exceeded",
            error_class: error.class.name,
            started_at: started_at
          )
        end
        channel.ack(delivery_info.delivery_tag)
      rescue Worker::TerminalProcessingError => error
        logger.error("terminal processing error event_id=#{event && event['event_id']} error=#{error.message}")
        record_metric(
          event: event,
          status: "failed_terminal",
          retry_count: retry_count,
          moved_to_dlq: false,
          error_code: "terminal_processing_error",
          error_class: error.class.name,
          started_at: started_at
        )
        channel.ack(delivery_info.delivery_tag)
      rescue StandardError => error
        logger.error("unexpected consumer error=#{error.class.name} message=#{error.message}")
        if retry_count < config.max_retries
          next_retry = retry_count + 1
          backoff_seconds = exponential_backoff(next_retry)
          sleep(backoff_seconds)

          exchange.publish(
            payload,
            routing_key: config.routing_key,
            content_type: "application/json",
            persistent: true,
            headers: {
              "x-retry-count" => next_retry,
              "x-last-error" => error.class.name,
              "x-backoff-seconds" => backoff_seconds
            }
          )
          record_metric(
            event: event,
            status: "retried",
            retry_count: next_retry,
            moved_to_dlq: false,
            error_code: "unexpected_error",
            error_class: error.class.name,
            started_at: started_at
          )
        else
          publish_to_dlq(exchange, payload, "unexpected_error", retry_count)
          record_metric(
            event: event,
            status: "dlq",
            retry_count: retry_count,
            moved_to_dlq: true,
            error_code: "unexpected_error",
            error_class: error.class.name,
            started_at: started_at
          )
        end
        channel.ack(delivery_info.delivery_tag)
      end

      def publish_to_dlq(exchange, payload, reason, retry_count)
        exchange.publish(
          payload,
          routing_key: config.dlq_routing_key,
          content_type: "application/json",
          persistent: true,
          headers: {
            "x-dead-letter-reason" => reason,
            "x-retry-count" => retry_count
          }
        )
      end

      def exponential_backoff(attempt)
        [ 2**([ attempt - 1, 0 ].max), MAX_BACKOFF_SECONDS ].min
      end

      def record_metric(event:, status:, retry_count:, moved_to_dlq:, started_at:, error_code: nil, error_class: nil)
        return if event.nil?
        return if event["event_id"].to_s.empty? || event["job_id"].to_s.empty? || event["trace_id"].to_s.empty?

        db_client.record_processing_metric(
          event_id: event["event_id"],
          job_id: event["job_id"],
          status: status,
          retry_count: retry_count,
          moved_to_dlq: moved_to_dlq,
          processing_latency_ms: processing_latency_ms(started_at),
          trace_id: event["trace_id"],
          error_code: error_code,
          error_class: error_class
        )
      end

      def processing_latency_ms(started_at)
        elapsed_seconds = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at
        (elapsed_seconds * 1000).round
      end
    end
  end
end
