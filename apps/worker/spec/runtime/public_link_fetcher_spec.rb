# frozen_string_literal: true

require "spec_helper"
require "stringio"

RSpec.describe Worker::Runtime::PublicLinkFetcher do
  let(:storage_client) do
    Class.new do
      attr_reader :written

      def write_object_stream(storage_key:, io:, content_type:)
        @written = { storage_key: storage_key, body: io.read, content_type: content_type }
      end
    end.new
  end

  let(:fetcher) do
    described_class.new(
      storage_client: storage_client,
      max_bytes: 10 * 1024,
      resolver: ->(host) { host == "data.example.com" ? ["93.184.216.34"] : ["127.0.0.1"] },
      http_client: fake_http_client
    )
  end

  it "downloads a public CSV URL to storage by stream and returns checksum metadata" do
    response = Worker::Runtime::PublicLinkFetcher::HttpResponse.new(
      status: 200,
      headers: { "content-type" => "text/csv", "content-length" => "18" },
      body: StringIO.new("name,cpf\nAlice,123\n"),
      final_url: "https://data.example.com/export.csv"
    )

    fake_http_client = Class.new do
      define_method(:head) { |_| response }
      define_method(:get) { |_| response }
    end.new

    fetcher = described_class.new(
      storage_client: storage_client,
      max_bytes: 10 * 1024,
      resolver: ->(_) { ["93.184.216.34"] },
      http_client: fake_http_client
    )

    result = fetcher.call(url: "https://data.example.com/export.csv", storage_key: "uploads/external/export.csv")

    expect(result.content_type).to eq("text/csv")
    expect(result.byte_size).to eq(19)
    expect(result.checksum_sha256).to match(/\A[a-f0-9]{64}\z/)
    expect(storage_client.written[:body]).to include("Alice")
  end

  it "blocks private destinations before issuing HTTP requests" do
    expect do
      fetcher.call(url: "http://localhost/private.csv", storage_key: "uploads/external/private.csv")
    end.to raise_error(Worker::TerminalProcessingError, /public_link_url_not_public/)
  end

  def fake_http_client
    Class.new do
      def head(_url)
        raise "should not be called"
      end

      def get(_url)
        raise "should not be called"
      end
    end.new
  end
end
