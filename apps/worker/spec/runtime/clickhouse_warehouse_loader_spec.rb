# frozen_string_literal: true

require "spec_helper"

RSpec.describe Worker::Runtime::ClickhouseWarehouseLoader do
  let(:config) do
    Worker::Config.new(
      env: {
        "CLICKHOUSE_HMAC_SECRET" => "test-secret",
        "CLICKHOUSE_TTL_DAYS" => "30"
      }
    )
  end
  let(:client) { FakeClickhouseClient.new }
  let(:loader) { described_class.new(config: config, client: client) }
  let(:connection) { FakeClickhousePostgresConnection.new }
  let(:ids) do
    {
      job_id: "job_fixture",
      upload_id: "upload_fixture",
      trace_id: "trace_fixture",
      request_id: "request_fixture"
    }
  end
  let(:parse_result) do
    Worker::Processing::CsvZipParser::ParseResult.new(
      input_rows: 3,
      valid_rows: 2,
      invalid_rows: 1,
      valid_records: [
        { row_number: 2, payload: { "email" => "alice@example.com", "amount" => "42" } },
        { row_number: 3, payload: { "email" => "bob@example.com", "amount" => "84" } }
      ],
      invalid_records: [
        { row_number: 4, code: "empty_row", message: "Linha vazia no arquivo.", payload: { "email" => "", "amount" => "" } }
      ]
    )
  end

  it "creates ClickHouse schema with a 30 day TTL" do
    loader.ensure_schema!

    expect(client.statements.join("\n")).to include("CREATE TABLE IF NOT EXISTS streamgate_jobs")
    expect(client.statements.join("\n")).to include("CREATE TABLE IF NOT EXISTS streamgate_records")
    expect(client.statements.join("\n")).to include("TTL processed_at + INTERVAL 30 DAY")
  end

  it "loads job and record metadata without raw payload values" do
    loader.call(connection: connection, ids: ids, batch_id: "batch_fixture", parse_result: parse_result, processing_latency_ms: 37)

    job_rows = client.inserted.fetch("streamgate_jobs")
    record_rows = client.inserted.fetch("streamgate_records")

    expect(job_rows.first).to include(
      job_id: "job_fixture",
      upload_id: "upload_fixture",
      organization_id: "org_fixture",
      source_type: "upload",
      status: "completed",
      input_rows: 3,
      valid_rows: 2,
      invalid_rows: 1
    )
    expect(record_rows.size).to eq(3)
    expect(record_rows.map { |row| row.fetch(:record_status) }).to contain_exactly("valid", "valid", "invalid")
    expect(record_rows.first.fetch(:record_hash)).to match(/\A[a-f0-9]{64}\z/)
    expect(record_rows.to_json).not_to include("alice@example.com")
    expect(record_rows.to_json).not_to include("bob@example.com")
  end

  it "uses HMAC so identical rows have stable hashes without exposing the source value" do
    first = loader.send(:record_hash, { "email" => "alice@example.com" })
    second = loader.send(:record_hash, { "email" => "alice@example.com" })

    expect(first).to eq(second)
    expect(first).not_to eq(Digest::SHA256.hexdigest({ "email" => "alice@example.com" }.to_json))
  end
end

class FakeClickhouseClient
  attr_reader :statements, :inserted

  def initialize
    @statements = []
    @inserted = Hash.new { |hash, key| hash[key] = [] }
  end

  def execute(statement)
    statements << statement
  end

  def insert_json_each_row(table, rows)
    inserted[table].concat(rows)
  end
end

class FakeClickhousePostgresConnection
  def exec_params(sql, params)
    if sql.match?(/FROM jobs j/m)
      return FakeClickhousePostgresResult.new(
        [
          {
            "job_id" => params.fetch(0),
            "upload_id" => "upload_fixture",
            "organization_id" => "org_fixture",
            "source_type" => "upload",
            "status" => "completed",
            "quarantined_records_count" => "1",
            "job_created_at" => "2026-04-06 10:00:00",
            "processed_at" => "2026-04-06 10:05:00"
          }
        ]
      )
    end

    raise "Unhandled SQL: #{sql}"
  end
end

class FakeClickhousePostgresResult
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
