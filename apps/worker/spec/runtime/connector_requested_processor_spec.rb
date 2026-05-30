# frozen_string_literal: true

require "spec_helper"

RSpec.describe Worker::Runtime::ConnectorRequestedProcessor do
  it "claims a connector lease, stores the acquired object, and publishes upload.received" do
    config = Worker::Config.new(
      env: {
        "WORKER_INTERNAL_API_URL" => "http://api:3000",
        "WORKER_INTERNAL_TOKEN" => "worker-token",
        "UPLOAD_STORAGE_BUCKET" => "streamgate-uploads"
      }
    )
    storage = Class.new do
      attr_reader :written

      def write_object_stream(storage_key:, io:, content_type:)
        @written = { storage_key: storage_key, body: io.read, content_type: content_type }
      end
    end.new
    lease_client = Class.new do
      def claim(lease_id:)
        raise "bad lease" unless lease_id == "lease_1"

        {
          "connector" => { "kind" => "http", "settings" => { "url" => "https://data.example.test/orders.ndjson" }, "secrets" => {} },
          "ingestion" => { "storage_key" => "uploads/connectors/orders.ndjson", "content_type" => "application/x-ndjson" }
        }
      end
    end.new
    fetcher = Class.new do
      def call(ingestion:, connector: nil)
        raise "bad connector" unless connector.fetch("kind") == "http"

        Struct.new(:io, :content_type, :byte_size, :checksum_sha256, keyword_init: true).new(
          io: StringIO.new(%({"id":1}\n)),
          content_type: ingestion.fetch("content_type"),
          byte_size: 9,
          checksum_sha256: "a" * 64
        )
      end
    end.new
    scanner = instance_double(Worker::Runtime::MalwareScanner)
    allow(scanner).to receive(:scan_io).and_return(
      Worker::Runtime::MalwareScanner::Result.new(status: "clean", signature: nil)
    )
    processor = described_class.new(
      config: config,
      storage_client: storage,
      lease_client: lease_client,
      fetcher: fetcher,
      scanner: scanner,
      logger: Logger.new(nil)
    )

    result = processor.process(connector_event, retry_count: 0)

    expect(storage.written).to include(storage_key: "uploads/connectors/orders.ndjson", content_type: "application/x-ndjson")
    expect(result.dig(:publish, :routing_key)).to eq("upload.received.v1")
    expect(result.dig(:publish, :payload, :payload)).to include(
      storage_key: "uploads/connectors/orders.ndjson",
      content_type: "application/x-ndjson",
      checksum_sha256: "a" * 64,
      byte_size: 9
    )
  end

  def connector_event
    {
      "event_id" => "event_connector_1",
      "event_name" => "connector.ingestion.requested.v1",
      "occurred_at" => "2026-04-26T12:00:00Z",
      "producer" => "api",
      "payload_version" => 1,
      "correlation_id" => "req_connector_1",
      "trace_id" => "trace_connector_1",
      "request_id" => "req_connector_1",
      "upload_id" => "upload_connector_1",
      "job_id" => "job_connector_1",
      "payload" => {
        "lease_id" => "lease_1"
      }
    }
  end
end
