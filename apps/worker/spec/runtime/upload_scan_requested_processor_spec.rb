# frozen_string_literal: true

require "spec_helper"

RSpec.describe Worker::Runtime::UploadScanRequestedProcessor do
  let(:config) { Worker::Config.new(env: {}) }
  let(:logger) { instance_double(Logger, info: nil, warn: nil, error: nil) }
  let(:storage_client) { instance_double(Worker::Runtime::StorageClient) }
  let(:scanner) { instance_double(Worker::Runtime::MalwareScanner) }
  let(:db_client) { FakeScanDbClient.new }
  let(:processor) do
    described_class.new(
      config: config,
      db_client: db_client,
      storage_client: storage_client,
      scanner: scanner,
      logger: logger
    )
  end
  let(:event) do
    {
      "event_id" => "event_scan_fixture",
      "event_name" => "upload.scan.requested.v1",
      "upload_id" => "upload_fixture",
      "job_id" => "job_fixture",
      "trace_id" => "trace_scan_fixture",
      "request_id" => "request_scan_fixture",
      "correlation_id" => "correlation_scan_fixture",
      "payload" => {
        "storage_key" => "uploads/orders.csv",
        "checksum_sha256" => "a" * 64,
        "content_type" => "text/csv",
        "byte_size" => 128
      }
    }
  end

  it "marks clean scans and publishes upload.received without leaking scanner internals" do
    allow(storage_client).to receive(:read_object).with(storage_key: "uploads/orders.csv").and_return("order_id\n1\n")
    allow(scanner).to receive(:scan_io).and_return(
      Worker::Runtime::MalwareScanner::Result.new(status: "clean", signature: nil)
    )

    result = processor.process(event, retry_count: 0)

    expect(result.dig(:publish, :routing_key)).to eq("upload.received.v1")
    expect(result.dig(:publish, :payload, :event_name)).to eq("upload.received.v1")
    expect(result.dig(:publish, :payload, :payload)).to include(
      storage_key: "uploads/orders.csv",
      content_type: "text/csv",
      byte_size: 128
    )
    expect(db_client.connection.scan_status("upload_fixture")).to eq("clean")
    expect(db_client.connection.job_status("job_fixture")).to eq("pending")
  end

  it "quarantines infected uploads and does not publish a parse-ready event" do
    allow(storage_client).to receive(:read_object).with(storage_key: "uploads/orders.csv").and_return("EICAR")
    allow(scanner).to receive(:scan_io).and_return(
      Worker::Runtime::MalwareScanner::Result.new(status: "infected", signature: "Eicar-Test-Signature")
    )

    result = processor.process(event, retry_count: 0)

    expect(result).to eq(:quarantined)
    expect(db_client.connection.scan_status("upload_fixture")).to eq("infected")
    expect(db_client.connection.upload_status("upload_fixture")).to eq("quarantined")
    expect(db_client.connection.job_status("job_fixture")).to eq("failed")
    expect(db_client.connection.warnings).to include(include(code: "malware_detected", upload_id: "upload_fixture"))
  end
end

class FakeScanDbClient
  attr_reader :connection

  def initialize
    @connection = FakeScanConnection.new
  end

  def with_connection
    yield(connection)
  end
end

class FakeScanConnection
  attr_reader :warnings

  def initialize
    @uploads = { "upload_fixture" => "registered" }
    @jobs = { "job_fixture" => "pending" }
    @scans = { "upload_fixture" => "pending" }
    @warnings = []
  end

  def scan_status(upload_id)
    @scans.fetch(upload_id)
  end

  def upload_status(upload_id)
    @uploads.fetch(upload_id)
  end

  def job_status(job_id)
    @jobs.fetch(job_id)
  end

  def exec(_sql)
    true
  end

  def exec_params(sql, params)
    case sql
    when /UPDATE malware_scans SET status = 'scanning'/
      @scans[params[0]] = "scanning"
    when /UPDATE malware_scans SET status = \$1/
      @scans[params[2]] = params[0]
    when /UPDATE uploads SET status = 'quarantined'/
      @uploads[params[0]] = "quarantined"
    when /UPDATE jobs SET status = 'failed'/
      @jobs[params[0]] = "failed"
    when /INSERT INTO operational_warnings/
      @warnings << { id: params[0], job_id: params[1], upload_id: params[2], code: params[3], message: params[4] }
    when /INSERT INTO audit_events/, /INSERT INTO realtime_events/
      nil
    else
      raise "Unhandled SQL in FakeScanConnection: #{sql.lines.first.to_s.strip}"
    end

    FakeScanResult.new([])
  end
end

class FakeScanResult
  def initialize(rows)
    @rows = rows
  end

  def ntuples
    @rows.length
  end

  def [](index)
    @rows.fetch(index)
  end
end
