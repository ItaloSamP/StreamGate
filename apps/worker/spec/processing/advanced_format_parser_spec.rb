# frozen_string_literal: true

require "spec_helper"
require "stringio"
require "zip"

RSpec.describe Worker::Processing::CsvZipParser do
  subject(:parser) { described_class.new }

  it "parses newline delimited JSON records" do
    payload = <<~NDJSON
      {"id":1,"name":"first"}
      {"id":2,"name":"second"}
    NDJSON

    result = parser.parse(content_type: "application/x-ndjson", raw_content: StringIO.new(payload))

    expect(result.input_rows).to eq(2)
    expect(result.valid_rows).to eq(2)
    expect(result.valid_records).to include(
      hash_including(row_number: 1, payload: { "id" => "1", "name" => "first" })
    )
  end

  it "parses an xlsx worksheet with headers from the first sheet" do
    result = parser.parse(
      content_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      raw_content: minimal_xlsx
    )

    expect(result.input_rows).to eq(2)
    expect(result.valid_rows).to eq(2)
    expect(result.valid_records.first).to include(
      row_number: 2,
      payload: { "id" => "1", "name" => "Alice" }
    )
  end

  it "delegates parquet row streaming to the parquet runtime" do
    stub_const("Parquet", Module.new)
    allow(Parquet).to receive(:each_row).and_yield({ "id" => 1, "name" => "Alice" })

    result = parser.parse(content_type: "application/vnd.apache.parquet", raw_content: "parquet-bytes")

    expect(result.input_rows).to eq(1)
    expect(result.valid_records.first).to include(
      row_number: 1,
      payload: { "id" => "1", "name" => "Alice" }
    )
  end

  it "accepts zip archives with exactly one supported file type" do
    zip = Zip::OutputStream.write_buffer do |stream|
      stream.put_next_entry("records.ndjson")
      stream.write(%({"id":1,"name":"zip"}\n))
    end.string

    result = parser.parse(content_type: "application/zip", raw_content: zip)

    expect(result.input_rows).to eq(1)
    expect(result.valid_records.first[:payload]).to eq({ "id" => "1", "name" => "zip" })
  end

  def minimal_xlsx
    Zip::OutputStream.write_buffer do |stream|
      stream.put_next_entry("[Content_Types].xml")
      stream.write(<<~XML)
        <?xml version="1.0" encoding="UTF-8"?>
        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
          <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
          <Default Extension="xml" ContentType="application/xml"/>
          <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
          <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
          <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
        </Types>
      XML
      stream.put_next_entry("_rels/.rels")
      stream.write(<<~XML)
        <?xml version="1.0" encoding="UTF-8"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
        </Relationships>
      XML
      stream.put_next_entry("xl/workbook.xml")
      stream.write(<<~XML)
        <?xml version="1.0" encoding="UTF-8"?>
        <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
          <sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
        </workbook>
      XML
      stream.put_next_entry("xl/_rels/workbook.xml.rels")
      stream.write(<<~XML)
        <?xml version="1.0" encoding="UTF-8"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
          <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
        </Relationships>
      XML
      stream.put_next_entry("xl/sharedStrings.xml")
      stream.write(<<~XML)
        <?xml version="1.0" encoding="UTF-8"?>
        <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="6" uniqueCount="6">
          <si><t>id</t></si><si><t>name</t></si><si><t>1</t></si><si><t>Alice</t></si><si><t>2</t></si><si><t>Bob</t></si>
        </sst>
      XML
      stream.put_next_entry("xl/worksheets/sheet1.xml")
      stream.write(<<~XML)
        <?xml version="1.0" encoding="UTF-8"?>
        <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
          <sheetData>
            <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>
            <row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2" t="s"><v>3</v></c></row>
            <row r="3"><c r="A3" t="s"><v>4</v></c><c r="B3" t="s"><v>5</v></c></row>
          </sheetData>
        </worksheet>
      XML
    end.string
  end
end
