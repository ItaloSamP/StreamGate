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
        @public_link_processor = PublicLinkRequestedProcessor.new(
          config: config,
          db_client: db_client,
          storage_client: storage_client,
          logger: logger
        )
        @connector_processor = ConnectorRequestedProcessor.new(
          config: config,
          storage_client: storage_client,
          logger: logger
        )
      end

      def run
        session = build_session
        session.start
        channel = session.create_channel

        exchange = channel.topic(config.exchange_name, durable: true)
        queues = declare_topology(channel, exchange)

        logger.info("worker consumer started queue=#{config.queue_name} routing_key=#{config.routing_key}")
        subscribe_queue(queues.fetch(:connector), channel, exchange, block: false)
        subscribe_queue(queues.fetch(:public_link), channel, exchange, block: false)
        subscribe_queue(queues.fetch(:upload), channel, exchange, block: true)
      ensure
        channel&.close if channel&.open?
        session&.close if session&.open?
      end

      private

      attr_reader :config, :logger, :processor, :public_link_processor, :connector_processor, :db_client, :storage_client, :parser

      def build_session
        Bunny.new(
          hostname: config.broker_host,
          port: config.broker_port,
          username: config.broker_username,
          password: config.broker_password,
          vhost: config.broker_vhost,
          automatically_recover: true
        )
      end

      def declare_topology(channel, exchange)
        bind_dlq(channel, exchange, config.dlq_queue_name, config.dlq_routing_key)
        bind_dlq(channel, exchange, config.public_link_dlq_queue_name, config.public_link_dlq_routing_key)
        bind_dlq(channel, exchange, config.connector_requested_dlq_queue_name, config.connector_requested_dlq_routing_key)

        {
          upload: bind_queue(channel, exchange, config.queue_name, config.routing_key, config.dlq_routing_key),
          public_link: bind_queue(channel, exchange, config.public_link_queue_name, config.public_link_routing_key, config.public_link_dlq_routing_key),
          connector: bind_queue(
            channel,
            exchange,
            config.connector_requested_queue_name,
            config.connector_requested_routing_key,
            config.connector_requested_dlq_routing_key
          )
        }
      end

      def bind_dlq(channel, exchange, queue_name, routing_key)
        channel.queue(queue_name, durable: true).tap do |queue|
          queue.bind(exchange, routing_key: routing_key)
        end
      end

      def bind_queue(channel, exchange, queue_name, routing_key, dlq_routing_key)
        channel.queue(
          queue_name,
          durable: true,
          arguments: {
            "x-dead-letter-exchange" => config.exchange_name,
            "x-dead-letter-routing-key" => dlq_routing_key
          }
        ).tap do |queue|
          queue.bind(exchange, routing_key: routing_key)
        end
      end

      def subscribe_queue(queue, channel, exchange, block:)
        queue.subscribe(manual_ack: true, block: block) do |delivery_info, properties, payload|
          handle_message(channel, exchange, delivery_info, properties, payload)
        end
      end

      def handle_message(channel, exchange, delivery_info, properties, payload)
        retry_count = (properties.headers || {}).fetch("x-retry-count", 0).to_i
        started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        event = JSON.parse(payload)

        selected_processor = processor_for(event)
        result = selected_processor.process(event, retry_count: retry_count)
        publish_followup(exchange, result)
        status = result == :duplicate ? "duplicate" : "processed"

        record_metric(
          event: event,
          status: status,
          retry_count: retry_count,
          moved_to_dlq: false,
          started_at: started_at
        )
        channel.ack(delivery_info.delivery_tag)
      rescue JSON::ParserError => e
        logger.error("invalid payload json error=#{e.message}")
        publish_to_dlq(exchange, payload, "invalid_json", retry_count)
        channel.ack(delivery_info.delivery_tag)
      rescue Worker::TransientProcessingError => e
        if retry_count < config.max_retries
          next_retry = retry_count + 1
          backoff_seconds = exponential_backoff(next_retry)
          sleep(backoff_seconds)

          exchange.publish(
            payload,
            routing_key: retry_routing_key(event),
            content_type: "application/json",
            persistent: true,
            headers: {
              "x-retry-count" => next_retry,
              "x-last-error" => e.class.name,
              "x-backoff-seconds" => backoff_seconds
            }
          )
          logger.warn("message retried event_id=#{event && event["event_id"]} count=#{next_retry} backoff=#{backoff_seconds}s")
          record_metric(
            event: event,
            status: "retried",
            retry_count: next_retry,
            moved_to_dlq: false,
            error_code: "transient_processing_error",
            error_class: e.class.name,
            started_at: started_at
          )
        else
          publish_to_dlq(exchange, payload, "max_retries_exceeded", retry_count, event)
          logger.error("message moved to dlq event_id=#{event && event["event_id"]} retries=#{retry_count}")
          record_metric(
            event: event,
            status: "dlq",
            retry_count: retry_count,
            moved_to_dlq: true,
            error_code: "max_retries_exceeded",
            error_class: e.class.name,
            started_at: started_at
          )
        end
        channel.ack(delivery_info.delivery_tag)
      rescue Worker::TerminalProcessingError => e
        logger.error("terminal processing error event_id=#{event && event["event_id"]} error=#{e.message}")
        record_metric(
          event: event,
          status: "failed_terminal",
          retry_count: retry_count,
          moved_to_dlq: false,
          error_code: "terminal_processing_error",
          error_class: e.class.name,
          started_at: started_at
        )
        channel.ack(delivery_info.delivery_tag)
      rescue StandardError => e
        logger.error("unexpected consumer error=#{e.class.name} message=#{e.message}")
        if retry_count < config.max_retries
          next_retry = retry_count + 1
          backoff_seconds = exponential_backoff(next_retry)
          sleep(backoff_seconds)

          exchange.publish(
            payload,
            routing_key: retry_routing_key(event),
            content_type: "application/json",
            persistent: true,
            headers: {
              "x-retry-count" => next_retry,
              "x-last-error" => e.class.name,
              "x-backoff-seconds" => backoff_seconds
            }
          )
          record_metric(
            event: event,
            status: "retried",
            retry_count: next_retry,
            moved_to_dlq: false,
            error_code: "unexpected_error",
            error_class: e.class.name,
            started_at: started_at
          )
        else
          publish_to_dlq(exchange, payload, "unexpected_error", retry_count, event)
          record_metric(
            event: event,
            status: "dlq",
            retry_count: retry_count,
            moved_to_dlq: true,
            error_code: "unexpected_error",
            error_class: e.class.name,
            started_at: started_at
          )
        end
        channel.ack(delivery_info.delivery_tag)
      end

      def publish_to_dlq(exchange, payload, reason, retry_count, event = nil)
        exchange.publish(
          payload,
          routing_key: dlq_routing_key(event),
          content_type: "application/json",
          persistent: true,
          headers: {
            "x-dead-letter-reason" => reason,
            "x-retry-count" => retry_count
          }
        )
      end

      def processor_for(event)
        return public_link_processor if event["event_name"] == config.public_link_routing_key
        return connector_processor if event["event_name"] == config.connector_requested_routing_key

        processor
      end

      def publish_followup(exchange, result)
        return unless result.is_a?(Hash) && result[:publish]

        followup = result.fetch(:publish)
        exchange.publish(
          followup.fetch(:payload).to_json,
          routing_key: followup.fetch(:routing_key),
          content_type: "application/json",
          persistent: true,
          headers: {
            "x-event-name" => followup.fetch(:payload).fetch(:event_name),
            "x-payload-version" => followup.fetch(:payload).fetch(:payload_version)
          }
        )
      end

      def retry_routing_key(event)
        return config.public_link_routing_key if event && event["event_name"] == config.public_link_routing_key
        return config.connector_requested_routing_key if event && event["event_name"] == config.connector_requested_routing_key

        config.routing_key
      end

      def dlq_routing_key(event)
        return config.public_link_dlq_routing_key if event && event["event_name"] == config.public_link_routing_key
        return config.connector_requested_dlq_routing_key if event && event["event_name"] == config.connector_requested_routing_key

        config.dlq_routing_key
      end

      def exponential_backoff(attempt)
        [2**[attempt - 1, 0].max, MAX_BACKOFF_SECONDS].min
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
