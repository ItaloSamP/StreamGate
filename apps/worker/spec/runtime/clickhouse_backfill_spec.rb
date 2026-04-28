# frozen_string_literal: true

require "spec_helper"

RSpec.describe Worker::Runtime::ClickhouseBackfill do
  let(:config) { Worker::Config.new(env: { "CLICKHOUSE_HMAC_SECRET" => "test-secret" }) }
  let(:db_client) { FakeBackfillDbClient.new }
  let(:loader) { instance_double(Worker::Runtime::ClickhouseWarehouseLoader, load_snapshot!: true) }
  let(:backfill) { described_class.new(config: config, db_client: db_client, loader: loader) }

  it "loads existing snapshots and batches idempotently through the warehouse loader" do
    count = backfill.call

    expect(count).to eq(2)
    expect(loader).to have_received(:load_snapshot!).twice
    expect(loader).to have_received(:load_snapshot!).with(
      hash_including(
        connection: db_client.connection,
        snapshot: hash_including("job_id" => "job_fixture"),
        batch: hash_including("id" => "batch_fixture")
      )
    )
  end
end

class FakeBackfillDbClient
  attr_reader :connection

  def initialize
    @connection = FakeBackfillConnection.new
  end

  def with_connection
    yield(connection)
  end
end

class FakeBackfillConnection
  def exec_params(sql, params = [])
    if sql.match?(/FROM analytics_job_snapshots/m)
      return FakeBackfillResult.new(
        [
          {
            "job_id" => "job_fixture",
            "upload_id" => "upload_fixture",
            "organization_id" => "org_fixture",
            "source_type" => "upload",
            "status" => "completed",
            "quarantined_records_count" => "0",
            "job_created_at" => "2026-04-06 10:00:00",
            "last_synced_at" => "2026-04-06 10:05:00",
            "trace_id" => "trace_fixture",
            "request_id" => "request_fixture"
          }
        ]
      )
    end

    if sql.match?(/FROM job_batches/m)
      return FakeBackfillResult.new(
        [
          {
            "id" => "batch_fixture",
            "job_id" => params.fetch(0),
            "input_rows" => "2",
            "valid_rows" => "2",
            "invalid_rows" => "0"
          },
          {
            "id" => "batch_fixture_second",
            "job_id" => params.fetch(0),
            "input_rows" => "3",
            "valid_rows" => "2",
            "invalid_rows" => "1"
          }
        ]
      )
    end

    raise "Unhandled SQL: #{sql}"
  end
end

class FakeBackfillResult
  include Enumerable

  def initialize(rows)
    @rows = rows
  end

  def each(&block)
    @rows.each(&block)
  end

  def to_a
    @rows
  end
end
