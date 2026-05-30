# frozen_string_literal: true

require "spec_helper"

RSpec.describe Worker::Runtime::ConnectorFetcher do
  it "blocks localhost HTTP connector targets before issuing network requests" do
    fetcher = described_class.new

    expect do
      fetcher.call(
        connector: { "kind" => "http", "settings" => { "url" => "http://localhost/private.csv" }, "secrets" => {} },
        ingestion: { "content_type" => "text/csv" }
      )
    end.to raise_error(Worker::TerminalProcessingError, /connector_http_blocked_host/)
  end

  it "does not follow redirects for HTTP connector downloads" do
    fetcher = described_class.new
    response = Net::HTTPFound.new("1.1", "302", "Found")
    response["location"] = "http://169.254.169.254/latest/meta-data"
    http = instance_double(Net::HTTP)

    allow(Addrinfo).to receive(:getaddrinfo).and_return([Addrinfo.tcp("93.184.216.34", 443)])
    allow(Net::HTTP).to receive(:start).and_yield(http)
    allow(http).to receive(:request).and_yield(response)

    expect do
      fetcher.call(
        connector: { "kind" => "http", "settings" => { "url" => "https://data.example.test/private.csv" }, "secrets" => {} },
        ingestion: { "content_type" => "text/csv" }
      )
    end.to raise_error(Worker::TerminalProcessingError, /connector_http_status=302/)
  end

  it "streams S3 connector objects to a tempfile without exposing credentials" do
    fetcher = described_class.new
    s3_client = instance_double(Aws::S3::Client)

    allow(Aws::S3::Client).to receive(:new).and_return(s3_client)
    allow(s3_client).to receive(:get_object) do |_params, options|
      File.binwrite(options.fetch(:target), "id,name\n1,Ana\n")
    end

    result = fetcher.call(
      connector: {
        "kind" => "s3",
        "settings" => { "region" => "us-east-1", "bucket" => "finance", "endpoint" => "https://s3.example.test" },
        "secrets" => { "access_key_id" => "AKIASECRET", "secret_access_key" => "top-secret" }
      },
      ingestion: { "object_key" => "incoming/orders.csv", "content_type" => "text/csv" }
    )

    expect(Aws::S3::Client).to have_received(:new).with(hash_including(access_key_id: "AKIASECRET", secret_access_key: "top-secret"))
    expect(s3_client).to have_received(:get_object).with(hash_including(bucket: "finance", key: "incoming/orders.csv"), hash_including(:target))
    expect(result.content_type).to eq("text/csv")
    expect(result.byte_size).to eq(14)
    expect(result.io.read).to eq("id,name\n1,Ana\n")
  ensure
    result&.io&.close!
  end
end
