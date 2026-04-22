# frozen_string_literal: true

require "spec_helper"

RSpec.describe Worker::Runtime::ArtifactWriter do
  let(:storage_client) { instance_double(Worker::Runtime::StorageClient) }
  let(:logger) { instance_double(Logger, error: nil) }
  let(:writer) { described_class.new(storage_client: storage_client, logger: logger) }
  let(:connection) { FakeArtifactConnection.new }
  let(:parse_result) do
    Worker::Processing::CsvZipParser::ParseResult.new(
      input_rows: 3,
      valid_rows: 2,
      invalid_rows: 1,
      invalid_records: [
        { row_number: 3, code: "empty_row", message: "Linha vazia no arquivo.", payload: { "email" => "" } }
      ]
    )
  end
  let(:ids) do
    {
      event_id: "event_fixture",
      job_id: "job_fixture",
      upload_id: "upload_fixture",
      trace_id: "trace_fixture",
      request_id: "request_fixture",
      correlation_id: "correlation_fixture"
    }
  end

  it "writes the three final artifacts and persists metadata with checksum and byte size" do
    allow(storage_client).to receive(:write_object)

    artifacts = writer.call(connection: connection, ids: ids, batch_id: "batch_fixture", status: "quarantined_with_warnings", parse_result: parse_result)

    expect(artifacts.map { |artifact| artifact.fetch(:artifact_type) }).to eq(%w[processed_dataset quality_report audit_report])
    expect(storage_client).to have_received(:write_object).exactly(3).times
    expect(connection.inserted_artifacts.size).to eq(3)
    expect(connection.inserted_artifacts).to all(include(job_id: "job_fixture", status: "available", trace_id: "trace_fixture"))
    expect(connection.inserted_artifacts).to all(include(byte_size: be > 0, checksum_sha256: match(/\A[0-9a-f]{64}\z/)))
    expect(connection.artifact_metrics.map { |metric| metric[:status] }).to eq(%w[artifact_generated artifact_generated artifact_generated])
  end

  it "raises and lets the processor record a non-blocking artifact failure" do
    allow(storage_client).to receive(:write_object).and_raise(StandardError, "storage down")

    expect do
      writer.call(connection: connection, ids: ids, batch_id: "batch_fixture", status: "completed", parse_result: parse_result)
    end.to raise_error(StandardError, "storage down")
  end
end

class FakeArtifactConnection
  attr_reader :inserted_artifacts, :artifact_metrics

  def initialize
    @inserted_artifacts = []
    @artifact_metrics = []
  end

  def exec_params(sql, params)
    case sql
    when /INSERT INTO job_artifacts/
      @inserted_artifacts << {
        id: params[0],
        job_id: params[1],
        artifact_type: params[2],
        status: params[3],
        storage_key: params[4],
        filename: params[5],
        content_type: params[6],
        byte_size: params[7],
        checksum_sha256: params[8],
        trace_id: params[9],
        request_id: params[10]
      }
    when /INSERT INTO worker_processing_metrics/
      @artifact_metrics << { event_id: params[1], job_id: params[2], status: params[3], trace_id: params[9] }
    end
  end
end
