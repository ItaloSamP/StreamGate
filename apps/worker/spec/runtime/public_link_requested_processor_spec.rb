# frozen_string_literal: true

require "spec_helper"

RSpec.describe Worker::Runtime::PublicLinkRequestedProcessor do
  let(:config) { Worker::Config.new(env: {}) }
  let(:logger) { instance_double(Logger, warn: nil) }
  let(:db_client) { FakePublicLinkDbClient.new }
  let(:fetcher) { instance_double(Worker::Runtime::PublicLinkFetcher) }
  let(:processor) do
    described_class.new(
      config: config,
      db_client: db_client,
      storage_client: instance_double(Worker::Runtime::StorageClient),
      logger: logger,
      fetcher: fetcher
    )
  end
  let(:event) do
    {
      "event_id" => "event_public_link",
      "event_name" => "upload.public_link.requested.v1",
      "upload_id" => "upload_public",
      "job_id" => "job_public",
      "trace_id" => "trace_public",
      "request_id" => "request_public",
      "payload" => {
        "acquisition_id" => "acq_public",
        "source_url" => "https://data.example.com/orders.csv",
        "url_masked" => "https://data.example.com/orders.csv",
        "storage_key" => "uploads/external/orders.csv"
      }
    }
  end

  it "stores public link metadata and returns an upload.received follow-up event" do
    result = Worker::Runtime::PublicLinkFetcher::Result.new(
      checksum_sha256: "a" * 64,
      byte_size: 128,
      content_type: "text/csv",
      final_url: "https://data.example.com/orders.csv"
    )
    allow(fetcher).to receive(:call).and_return(result)

    output = processor.process(event, retry_count: 0)

    expect(db_client.connection.acquisition_status).to eq("stored")
    expect(db_client.connection.upload_status).to eq("stored")
    expect(output.dig(:publish, :routing_key)).to eq("upload.received.v1")
    expect(output.dig(:publish, :payload, :event_name)).to eq("upload.received.v1")
    expect(output.dig(:publish, :payload, :payload, :checksum_sha256)).to eq("a" * 64)
  end

  it "records a failed warning when the fetcher rejects the link" do
    allow(fetcher).to receive(:call).and_raise(Worker::TerminalProcessingError, "public_link_url_not_public")

    expect do
      processor.process(event, retry_count: 0)
    end.to raise_error(Worker::TerminalProcessingError)

    expect(db_client.connection.acquisition_status).to eq("failed")
    expect(db_client.connection.job_status).to eq("failed")
    expect(db_client.connection.warnings).to include(include(code: "public_link_fetch_failed", status: "failed"))
  end
end

class FakePublicLinkDbClient
  attr_reader :connection

  def initialize
    @connection = FakePublicLinkConnection.new
  end

  def with_connection
    yield(connection)
  end
end

class FakePublicLinkConnection
  attr_reader :acquisition_status, :upload_status, :job_status, :warnings

  def initialize
    @warnings = []
  end

  def exec_params(sql, params)
    case sql
    when /UPDATE upload_acquisitions SET status = \$1/
      @acquisition_status = params[0]
    when /UPDATE uploads/
      @upload_status = "stored"
    when /UPDATE upload_acquisitions\s+SET status = 'stored'/m
      @acquisition_status = "stored"
    when /UPDATE upload_acquisitions SET status = 'failed'/
      @acquisition_status = "failed"
    when /UPDATE jobs SET status = 'failed'/
      @job_status = "failed"
    when /INSERT INTO operational_warnings/
      @warnings << {
        id: params[0],
        job_id: params[1],
        upload_id: params[2],
        code: params[3],
        message: params[4],
        status: params[5]
      }
    else
      raise "Unhandled SQL: #{sql}"
    end
  end
end
