# frozen_string_literal: true

require "spec_helper"
require "stringio"
require "zip"

RSpec.describe Worker::Processing::CsvZipParser do
  subject(:parser) { described_class.new }

  it "parses a JSON array of records and quarantines empty objects" do
    payload = '[{"name":"Alice","cpf":"123"},{},{"name":"Bob","cpf":"456"}]'

    result = parser.parse(content_type: "application/json", raw_content: StringIO.new(payload))

    expect(result.input_rows).to eq(3)
    expect(result.valid_rows).to eq(2)
    expect(result.invalid_rows).to eq(1)
    expect(result.invalid_records.first[:code]).to eq("empty_record")
  end

  it "parses JSON records envelopes without loading callers into a different API" do
    payload = '{"records":[{"name":"Alice"},{"name":"Bob"}]}'

    result = parser.parse(content_type: "application/json", raw_content: StringIO.new(payload))

    expect(result.input_rows).to eq(2)
    expect(result.valid_rows).to eq(2)
    expect(result.invalid_rows).to eq(0)
  end

  it "rejects zip entries that escape the archive root" do
    io = StringIO.new
    Zip::OutputStream.write_buffer(io) do |zip|
      zip.put_next_entry("../escape.csv")
      zip.write("name,cpf\nAlice,123\n")
    end
    io.rewind

    expect do
      parser.parse(content_type: "application/zip", raw_content: io)
    end.to raise_error(Worker::TerminalProcessingError, /zip_entry_unsafe/)
  end
end
