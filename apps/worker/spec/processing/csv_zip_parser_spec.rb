# frozen_string_literal: true

require "spec_helper"
require "stringio"
require "zip"

RSpec.describe Worker::Processing::CsvZipParser do
  subject(:parser) { described_class.new }

  it "parses csv and classifies empty rows as invalid" do
    csv = "name,cpf\nAlice,123\n,\nBob,456\n"

    result = parser.parse(content_type: "text/csv", raw_content: csv)

    expect(result.input_rows).to eq(3)
    expect(result.valid_rows).to eq(2)
    expect(result.invalid_rows).to eq(1)
    expect(result.invalid_records.first[:code]).to eq("empty_row")
  end

  it "parses first csv entry from zip payload" do
    io = StringIO.new
    Zip::OutputStream.write_buffer(io) do |zip|
      zip.put_next_entry("batch.csv")
      zip.write("name,cpf\nAlice,123\n")
    end
    io.rewind

    result = parser.parse(content_type: "application/zip", raw_content: io.read)

    expect(result.input_rows).to eq(1)
    expect(result.valid_rows).to eq(1)
    expect(result.invalid_rows).to eq(0)
  end

  it "accepts semicolon-separated csv" do
    csv = "name;cpf\nAlice;123\nBob;456\n"

    result = parser.parse(content_type: "text/csv", raw_content: csv)

    expect(result.input_rows).to eq(2)
    expect(result.valid_rows).to eq(2)
    expect(result.invalid_rows).to eq(0)
  end

  it "fails when zip has more than one csv entry" do
    io = StringIO.new
    Zip::OutputStream.write_buffer(io) do |zip|
      zip.put_next_entry("first.csv")
      zip.write("name,cpf\nAlice,123\n")
      zip.put_next_entry("second.csv")
      zip.write("name,cpf\nBob,456\n")
    end
    io.rewind

    expect do
      parser.parse(content_type: "application/zip", raw_content: io.read)
    end.to raise_error(Worker::TerminalProcessingError, /zip_with_multiple_csv_entries/)
  end
end
