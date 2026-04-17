# frozen_string_literal: true

require "spec_helper"

class FakeWorkerChannel
  attr_reader :acked_tags

  def initialize
    @acked_tags = []
  end

  def ack(delivery_tag)
    @acked_tags << delivery_tag
  end
end

class FakeWorkerExchange
  attr_reader :published

  def initialize
    @published = []
  end

  def publish(payload, options = {})
    @published << options.merge(payload: payload)
  end
end

RSpec.describe Worker::Runtime::Consumer do
  let(:config) { Worker::Config.new(env: { "WORKER_MAX_RETRIES" => "3" }) }
  let(:logger) { instance_double(Logger, info: nil, warn: nil, error: nil) }
  let(:consumer) { described_class.new(config: config, logger: logger) }
  let(:channel) { FakeWorkerChannel.new }
  let(:exchange) { FakeWorkerExchange.new }
  let(:delivery_info) { Struct.new(:delivery_tag).new("delivery-1") }

  before do
    consumer.instance_variable_set(:@processor, processor)
    consumer.instance_variable_set(:@db_client, db_client)
    allow(consumer).to receive(:sleep)
  end

  let(:processor) { instance_double(Worker::Runtime::UploadReceivedProcessor, process: :processed) }
  let(:db_client) { instance_double(Worker::Runtime::DbClient, record_processing_metric: nil) }

  it "acks valid messages and records processing metrics" do
    payload = event_payload.to_json

    consumer.send(:handle_message, channel, exchange, delivery_info, properties, payload)

    expect(processor).to have_received(:process).with(hash_including("event_id" => "event_fixture"), retry_count: 0)
    expect(channel.acked_tags).to eq(["delivery-1"])
    expect(exchange.published).to be_empty
    expect(db_client).to have_received(:record_processing_metric).with(hash_including(status: "processed", moved_to_dlq: false))
  end

  it "moves invalid json to DLQ and acks without requeue" do
    consumer.send(:handle_message, channel, exchange, delivery_info, properties, "{invalid-json")

    expect(channel.acked_tags).to eq(["delivery-1"])
    expect(exchange.published.first).to include(
      payload: "{invalid-json",
      routing_key: "upload.received.v1.dlq",
      headers: hash_including("x-dead-letter-reason" => "invalid_json")
    )
  end

  it "retries transient errors with bounded backoff before acking" do
    allow(processor).to receive(:process).and_raise(Worker::TransientProcessingError, "storage timeout")

    consumer.send(:handle_message, channel, exchange, delivery_info, properties("x-retry-count" => 1), event_payload.to_json)

    expect(consumer).to have_received(:sleep).with(2)
    expect(channel.acked_tags).to eq(["delivery-1"])
    expect(exchange.published.first).to include(
      routing_key: "upload.received.v1",
      headers: hash_including("x-retry-count" => 2, "x-backoff-seconds" => 2)
    )
    expect(db_client).to have_received(:record_processing_metric).with(hash_including(status: "retried", retry_count: 2, moved_to_dlq: false))
  end

  it "moves transient poison messages to DLQ after max retries" do
    allow(processor).to receive(:process).and_raise(Worker::TransientProcessingError, "storage timeout")

    consumer.send(:handle_message, channel, exchange, delivery_info, properties("x-retry-count" => 3), event_payload.to_json)

    expect(consumer).not_to have_received(:sleep)
    expect(channel.acked_tags).to eq(["delivery-1"])
    expect(exchange.published.first).to include(
      routing_key: "upload.received.v1.dlq",
      headers: hash_including("x-dead-letter-reason" => "max_retries_exceeded", "x-retry-count" => 3)
    )
    expect(db_client).to have_received(:record_processing_metric).with(hash_including(status: "dlq", retry_count: 3, moved_to_dlq: true))
  end

  it "acks terminal errors without retry or DLQ requeue" do
    allow(processor).to receive(:process).and_raise(Worker::TerminalProcessingError, "invalid_event_name")

    consumer.send(:handle_message, channel, exchange, delivery_info, properties, event_payload.to_json)

    expect(channel.acked_tags).to eq(["delivery-1"])
    expect(exchange.published).to be_empty
    expect(db_client).to have_received(:record_processing_metric).with(hash_including(status: "failed_terminal", moved_to_dlq: false))
  end

  def event_payload
    {
      "event_id" => "event_fixture",
      "event_name" => "upload.received.v1",
      "job_id" => "job_fixture",
      "upload_id" => "upload_fixture",
      "trace_id" => "trace_fixture",
      "payload" => { "storage_key" => "uploads/user/file.csv", "content_type" => "text/csv" }
    }
  end

  def properties(headers = {})
    Struct.new(:headers).new(headers)
  end
end
