# frozen_string_literal: true

require "set"
require "spec_helper"

RSpec.describe Worker::Runtime::UploadReceivedProcessor do
  let(:config) { Worker::Config.new(env: {}) }
  let(:logger) { instance_double(Logger, info: nil, warn: nil, error: nil) }
  let(:storage_client) { instance_double(Worker::Runtime::StorageClient) }
  let(:parser) { instance_double(Worker::Processing::CsvZipParser) }
  let(:artifact_writer) { instance_double(Worker::Runtime::ArtifactWriter) }
  let(:notifier) { instance_double(Worker::Runtime::OperationalNotifier) }
  let(:warehouse_loader) { instance_double(Worker::Runtime::ClickhouseWarehouseLoader, call: true) }
  let(:db_client) { FakeProcessorDbClient.new }
  let(:processor) do
    described_class.new(
      config: config,
      db_client: db_client,
      storage_client: storage_client,
      parser: parser,
      logger: logger,
      artifact_writer: artifact_writer,
      notifier: notifier,
      warehouse_loader: warehouse_loader
    )
  end
  let(:event) do
    {
      "event_id" => "event_fixture",
      "event_name" => "upload.received.v1",
      "upload_id" => "upload_fixture",
      "job_id" => "job_fixture",
      "trace_id" => "trace_fixture",
      "request_id" => "request_fixture",
      "correlation_id" => "correlation_fixture",
      "payload" => {
        "storage_key" => "uploads/orders.csv",
        "content_type" => "text/csv"
      }
    }
  end
  let(:parse_result) do
    Worker::Processing::CsvZipParser::ParseResult.new(
      input_rows: 2,
      valid_rows: 2,
      invalid_rows: 0,
      valid_records: [
        { row_number: 2, payload: { "order_id" => "1001", "amount" => "42" } },
        { row_number: 3, payload: { "order_id" => "1002", "amount" => "84" } }
      ],
      invalid_records: []
    )
  end

  it "returns duplicate without parsing when the event id was already consumed" do
    db_client.connection.mark_duplicate!("event_fixture")
    allow(parser).to receive(:parse)

    result = processor.process(event, retry_count: 0)

    expect(result).to eq(:duplicate)
    expect(parser).not_to have_received(:parse)
  end

  it "records artifact failure as non-blocking and still completes the job transition" do
    allow(storage_client).to receive(:read_object).and_return("order_id,amount\n1001,42\n1002,84\n")
    allow(parser).to receive(:parse).and_return(parse_result)
    allow(artifact_writer).to receive(:call).and_raise(StandardError, "storage down")
    allow(notifier).to receive(:emit_job_transition)

    result = processor.process(event, retry_count: 0)

    expect(result).to eq(:processed)
    expect(db_client.connection.job_status("job_fixture")).to eq("completed")
    expect(db_client.connection.audit_events.map { |audit| audit.fetch(:action) }).to include("worker.job.completed", "worker.artifacts.failed")
    expect(db_client.connection.metrics).to include(include(status: "artifact_failed", job_id: "job_fixture", trace_id: "trace_fixture"))
    expect(notifier).to have_received(:emit_job_transition).with(
      hash_including(
        ids: hash_including(job_id: "job_fixture"),
        status: "completed",
        event_name: "job.completed"
      )
    )
  end

  it "loads ClickHouse after the main job transition without blocking artifacts or notifications" do
    allow(storage_client).to receive(:read_object).and_return("order_id,amount\n1001,42\n1002,84\n")
    allow(parser).to receive(:parse).and_return(parse_result)
    allow(artifact_writer).to receive(:call).and_return([])
    allow(notifier).to receive(:emit_job_transition)

    result = processor.process(event, retry_count: 0)

    expect(result).to eq(:processed)
    expect(warehouse_loader).to have_received(:call).with(
      hash_including(
        connection: db_client.connection,
        ids: hash_including(job_id: "job_fixture"),
        batch_id: /^batch_/,
        parse_result: parse_result
      )
    )
    expect(db_client.connection.job_status("job_fixture")).to eq("completed")
  end

  it "records a warning when ClickHouse load fails and keeps the job completed" do
    allow(storage_client).to receive(:read_object).and_return("order_id,amount\n1001,42\n1002,84\n")
    allow(parser).to receive(:parse).and_return(parse_result)
    allow(artifact_writer).to receive(:call).and_return([])
    allow(notifier).to receive(:emit_job_transition)
    allow(warehouse_loader).to receive(:call).and_raise(Worker::Runtime::ClickhouseWarehouseLoader::Error, "clickhouse down")

    result = processor.process(event, retry_count: 0)

    expect(result).to eq(:processed)
    expect(db_client.connection.job_status("job_fixture")).to eq("completed")
    expect(db_client.connection.operational_warnings).to include(
      include(code: "clickhouse_load_failed", status: "open", job_id: "job_fixture", upload_id: "upload_fixture")
    )
  end
end

class FakeProcessorDbClient
  attr_reader :connection

  def initialize
    @connection = FakeProcessorConnection.new
  end

  def with_connection
    yield(connection)
  end
end

class FakeProcessorConnection
  attr_reader :audit_events, :metrics, :operational_warnings

  def initialize
    @consumed_event_ids = Set.new
    @attempts = []
    @jobs = {
      "job_fixture" => {
        "id" => "job_fixture",
        "upload_id" => "upload_fixture",
        "status" => "pending"
      }
    }
    @audit_events = []
    @metrics = []
    @operational_warnings = []
  end

  def mark_duplicate!(event_id)
    @consumed_event_ids << event_id
  end

  def job_status(job_id)
    @jobs.fetch(job_id).fetch("status")
  end

  def exec(_sql)
    true
  end

  def exec_params(sql, params)
    handler = sql_handlers.find { |matcher, _method_name| sql.match?(matcher) }
    if handler
      _matcher, method_name = handler
      return send(method_name, params)
    end

    raise "Unhandled SQL in FakeProcessorConnection: #{sql.lines.first.to_s.strip}"
  end

  private

  def sql_handlers
    [
      [/SELECT id FROM jobs .* FOR UPDATE/m, :select_job_for_update],
      [/INSERT INTO worker_consumed_events/, :insert_consumed_event],
      [/DELETE FROM worker_consumed_events/, :delete_consumed_event],
      [/UPDATE jobs SET status = 'processing'/, :update_job_processing],
      [/SELECT COALESCE\(MAX\(attempt_number\), 0\) AS max_attempt FROM processing_attempts/, :select_max_attempt],
      [/INSERT INTO processing_attempts/, :insert_processing_attempt],
      [/INSERT INTO job_batches/, :return_empty_result],
      [/INSERT INTO quarantine_records/, :return_empty_result],
      [/UPDATE jobs SET status = \$1, quarantined_records_count = \$2, updated_at = NOW\(\) WHERE id = \$3/, :update_job_status],
      [/UPDATE processing_attempts SET status = 'succeeded'/, :mark_attempt_succeeded],
      [/INSERT INTO analytics_job_snapshots/, :return_empty_result],
      [/INSERT INTO operational_warnings/, :insert_operational_warning],
      [/INSERT INTO audit_events/, :insert_audit_event],
      [/INSERT INTO worker_processing_metrics/, :insert_processing_metric]
    ]
  end

  def select_job_for_update(params)
    job = @jobs[params[0]]
    return result_rows([]) if job.nil? || job.fetch("upload_id") != params[1]

    result_rows([{ "id" => params[0] }])
  end

  def insert_consumed_event(params)
    return result_rows([]) if @consumed_event_ids.include?(params[1])

    @consumed_event_ids << params[1]
    result_rows([{ "id" => params[0] }])
  end

  def delete_consumed_event(params)
    @consumed_event_ids.delete(params[0])
    result_rows([])
  end

  def update_job_processing(params)
    @jobs.fetch(params[0])["status"] = "processing"
    result_rows([])
  end

  def select_max_attempt(_params)
    result_rows([{ "max_attempt" => @attempts.size.to_s }])
  end

  def return_empty_result(_params)
    result_rows([])
  end

  def insert_processing_attempt(params)
    @attempts << { id: params[0], job_id: params[1], attempt_number: params[2], status: "started" }
    result_rows([])
  end

  def update_job_status(params)
    @jobs.fetch(params[2])["status"] = params[0]
    result_rows([])
  end

  def mark_attempt_succeeded(params)
    attempt = @attempts.find { |entry| entry[:id] == params[0] }
    attempt[:status] = "succeeded" if attempt
    result_rows([])
  end

  def insert_audit_event(params)
    @audit_events << {
      id: params[0],
      action: params[1],
      auditable_type: params[3],
      auditable_id: params[4],
      request_id: params[5],
      trace_id: params[6],
      metadata: JSON.parse(params[7])
    }
    result_rows([])
  end

  def insert_processing_metric(params)
    @metrics << {
      id: params[0],
      event_id: params[1],
      job_id: params[2],
      status: "artifact_failed",
      error_class: params[3],
      trace_id: params[4]
    }
    result_rows([])
  end

  def insert_operational_warning(params)
    @operational_warnings << {
      id: params[0],
      job_id: params[1],
      upload_id: params[2],
      code: "clickhouse_load_failed",
      message: params[3],
      status: "open",
      retry_count: 0,
      trace_id: params[4],
      request_id: params[5]
    }
    result_rows([])
  end

  def result_rows(rows)
    FakeProcessorResult.new(rows)
  end
end

class FakeProcessorResult
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
