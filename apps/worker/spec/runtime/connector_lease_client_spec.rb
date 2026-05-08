# frozen_string_literal: true

require "json"
require "net/http"
require "spec_helper"

RSpec.describe Worker::Runtime::ConnectorLeaseClient do
  it "claims a connector lease with worker authentication only" do
    config = Worker::Config.new(
      env: {
        "WORKER_INTERNAL_API_URL" => "http://api:3000",
        "WORKER_INTERNAL_TOKEN" => "worker-token"
      }
    )
    captured_request = nil
    response = Net::HTTPOK.new("1.1", "200", "OK")
    allow(response).to receive(:body).and_return({
      data: {
        lease: { id: "lease_1", status: "claimed" },
        connector: { kind: "http", settings: { url: "https://data.example.test/orders.ndjson" }, secrets: {} },
        ingestion: { storage_key: "uploads/connectors/orders.ndjson", content_type: "application/x-ndjson" }
      }
    }.to_json)
    fake_http = Object.new
    fake_http.define_singleton_method(:request) do |request|
      captured_request = request
      response
    end

    allow(Net::HTTP).to receive(:start).and_yield(fake_http)

    data = described_class.new(config: config).claim(lease_id: "lease_1")

    expect(data.fetch("lease").fetch("status")).to eq("claimed")
    expect(captured_request["X-Worker-Token"]).to eq("worker-token")
    expect(captured_request["X-Connector-Lease-Token"]).to be_nil
    expect(captured_request.body).to be_nil
  end
end
