# frozen_string_literal: true

require "csv"
require "json"
require "pathname"
require "zip"
require "stringio"
require "tempfile"
require "rexml/document"

module Worker
  module Processing
    class CsvZipParser
      ParseResult = Struct.new(:input_rows, :valid_rows, :invalid_rows, :invalid_records, :valid_records, keyword_init: true)
      XLSX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      PARQUET_CONTENT_TYPE = "application/vnd.apache.parquet"
      MAX_ZIP_ENTRIES = 50
      MAX_ZIP_UNCOMPRESSED_BYTES = 10 * 1024 * 1024 * 1024
      MAX_ZIP_EXPANSION_RATIO = 100

      def parse(content_type:, raw_content:)
        raw_content = read_content(raw_content)

        case content_type
        when "text/csv"
          parse_csv(raw_content)
        when "application/json"
          parse_json(raw_content)
        when "application/x-ndjson", "application/ndjson"
          parse_ndjson(raw_content)
        when "application/zip"
          parse_zip(raw_content)
        when XLSX_CONTENT_TYPE
          parse_xlsx(raw_content)
        when PARQUET_CONTENT_TYPE
          parse_parquet(raw_content)
        else
          raise Worker::TerminalProcessingError, "unsupported content_type=#{content_type}"
        end
      end

      private

      def read_content(raw_content)
        return raw_content.read if raw_content.respond_to?(:read)

        raw_content.to_s
      end

      def parse_zip(raw_content)
        supported_entry = nil
        Zip::File.open_buffer(StringIO.new(raw_content)) do |zip_file|
          entries = zip_file.entries.reject(&:directory?)
          raise Worker::TerminalProcessingError, "zip_too_many_entries" if entries.size > MAX_ZIP_ENTRIES

          compressed_size = [raw_content.bytesize, 1].max
          uncompressed_size = entries.sum { |entry| entry.size.to_i }
          if uncompressed_size > MAX_ZIP_UNCOMPRESSED_BYTES || uncompressed_size / compressed_size > MAX_ZIP_EXPANSION_RATIO
            raise Worker::TerminalProcessingError, "zip_bomb_suspected"
          end

          entries.each { |entry| validate_zip_entry!(entry.name) }

          supported_entries = entries.filter_map { |entry| zip_supported_entry(entry) }
          raise Worker::TerminalProcessingError, "zip_without_supported_file" if supported_entries.empty?
          raise Worker::TerminalProcessingError, zip_multiple_supported_reason(supported_entries) if supported_entries.size > 1

          entry, content_type = supported_entries.first
          supported_entry = [entry.get_input_stream.read, content_type]
        end

        parse(content_type: supported_entry.fetch(1), raw_content: supported_entry.fetch(0))
      end

      def zip_multiple_supported_reason(supported_entries)
        return "zip_with_multiple_csv_entries" if supported_entries.all? { |(_, content_type)| content_type == "text/csv" }

        "zip_with_multiple_supported_files"
      end

      def zip_supported_entry(entry)
        name = entry.name.downcase
        content_type = if name.end_with?(".csv")
                         "text/csv"
                       elsif name.end_with?(".json")
                         "application/json"
                       elsif name.end_with?(".ndjson", ".jsonl")
                         "application/x-ndjson"
                       elsif name.end_with?(".xlsx")
                         XLSX_CONTENT_TYPE
                       elsif name.end_with?(".parquet")
                         PARQUET_CONTENT_TYPE
                       end
        content_type ? [entry, content_type] : nil
      end

      def validate_zip_entry!(name)
        normalized = name.to_s.tr("\\", "/")
        path = Pathname.new(normalized)
        return unless normalized.start_with?("/") || path.absolute? || normalized.split("/").include?("..")

        raise Worker::TerminalProcessingError, "zip_entry_unsafe"
      end

      def parse_json(raw_content)
        payload = JSON.parse(raw_content.to_s)
        records = if payload.is_a?(Array)
                    payload
                  elsif payload.is_a?(Hash) && payload["records"].is_a?(Array)
                    payload["records"]
                  else
                    raise Worker::TerminalProcessingError, "json_records_required"
                  end

        invalid_records = []
        valid_records = []

        records.each_with_index do |record, index|
          unless record.is_a?(Hash)
            invalid_records << invalid_record(index, "invalid_record", record)
            next
          end

          normalized = record.transform_values { |value| value.to_s.strip }
          if normalized.empty? || normalized.values.all?(&:empty?)
            invalid_records << invalid_record(index, "empty_record", normalized)
            next
          end

          valid_records << { row_number: index + 1, payload: normalized }
        end

        ParseResult.new(
          input_rows: records.size,
          valid_rows: valid_records.size,
          invalid_rows: invalid_records.size,
          invalid_records: invalid_records,
          valid_records: valid_records
        )
      rescue JSON::ParserError => e
        raise Worker::TerminalProcessingError, "invalid_json: #{e.message}"
      end

      def parse_ndjson(raw_content)
        records = raw_content.to_s.each_line.filter_map do |line|
          stripped = line.strip
          next if stripped.empty?

          JSON.parse(stripped)
        end
        parse_records(records)
      rescue JSON::ParserError => e
        raise Worker::TerminalProcessingError, "invalid_ndjson: #{e.message}"
      end

      def parse_xlsx(raw_content)
        if roo_available?
          begin
            return parse_xlsx_with_roo(raw_content)
          rescue StandardError
            # Some generated/minimal XLSX files omit optional workbook parts
            # that Roo expects. Fall back to a conservative XML reader.
          end
        end

        parse_xlsx_minimal(raw_content)
      end

      def parse_xlsx_with_roo(raw_content)
        require "roo" unless defined?(Roo)
        with_tempfile(raw_content, ".xlsx") do |file|
          sheet = Roo::Spreadsheet.open(file.path).sheet(0)
          headers = sheet.row(1).map { |header| header.to_s.strip }
          raise Worker::TerminalProcessingError, "xlsx_header_required" if headers.empty? || headers.any?(&:empty?)

          records = (2..sheet.last_row).map do |row_number|
            values = sheet.row(row_number)
            headers.each_with_index.to_h { |header, index| [header, values[index].to_s.strip] }
          end
          parse_records(records, first_row_number: 2)
        end
      end

      def parse_xlsx_minimal(raw_content)
        rows = []
        Zip::File.open_buffer(StringIO.new(raw_content)) do |zip|
          rows = read_xlsx_rows(zip, read_xlsx_shared_strings(zip))
        end

        parse_xlsx_rows(rows)
      rescue Zip::Error, REXML::ParseException => e
        raise Worker::TerminalProcessingError, "invalid_xlsx: #{e.message}"
      end

      def read_xlsx_shared_strings(zip)
        shared_entry = zip.find_entry("xl/sharedStrings.xml")
        return [] if shared_entry.nil?

        doc = REXML::Document.new(shared_entry.get_input_stream.read)
        REXML::XPath.each(doc, "//*[local-name()='si']").map do |si|
          si.get_elements(".//*[local-name()='t']").map(&:text).join
        end
      end

      def read_xlsx_rows(zip, shared_strings)
        sheet_entry = zip.find_entry("xl/worksheets/sheet1.xml")
        raise Worker::TerminalProcessingError, "xlsx_sheet_required" if sheet_entry.nil?

        doc = REXML::Document.new(sheet_entry.get_input_stream.read)
        REXML::XPath.each(doc, "//*[local-name()='row']").map do |row|
          xlsx_row_values(row, shared_strings)
        end
      end

      def xlsx_row_values(row, shared_strings)
        values = []
        REXML::XPath.each(row, "*[local-name()='c']") do |cell|
          index = column_index(cell.attributes["r"])
          values[index] = xlsx_cell_value(cell, shared_strings)
        end
        values
      end

      def parse_xlsx_rows(rows)
        headers = Array(rows.shift).map { |header| header.to_s.strip }
        raise Worker::TerminalProcessingError, "xlsx_header_required" if headers.empty? || headers.any?(&:empty?)

        records = rows.map do |row|
          headers.each_with_index.to_h { |header, index| [header, row[index].to_s.strip] }
        end
        parse_records(records, first_row_number: 2)
      end

      def parse_parquet(raw_content)
        require "parquet" unless defined?(Parquet)

        records = []
        with_tempfile(raw_content, ".parquet") do |file|
          Parquet.each_row(file.path) do |row|
            records << row
          end
        end
        parse_records(records)
      rescue LoadError => e
        raise Worker::TerminalProcessingError, "parquet_runtime_unavailable: #{e.message}"
      rescue StandardError => e
        raise Worker::TerminalProcessingError, "invalid_parquet: #{e.message}"
      end

      def invalid_record(index, code, payload)
        {
          row_number: index + 1,
          code: code,
          message: "Registro invalido no arquivo.",
          payload: payload
        }
      end

      def parse_records(records, first_row_number: 1)
        invalid_records = []
        valid_records = []

        records.each_with_index do |record, index|
          row_number = first_row_number + index
          unless record.is_a?(Hash)
            invalid_records << invalid_record(row_number - 1, "invalid_record", record)
            next
          end

          normalized = record.transform_keys(&:to_s).transform_values { |value| value.to_s.strip }
          if normalized.empty? || normalized.values.all?(&:empty?)
            invalid_records << invalid_record(row_number - 1, "empty_record", normalized)
            next
          end

          valid_records << { row_number: row_number, payload: normalized }
        end

        ParseResult.new(
          input_rows: records.size,
          valid_rows: valid_records.size,
          invalid_rows: invalid_records.size,
          invalid_records: invalid_records,
          valid_records: valid_records
        )
      end

      def parse_csv(raw_content)
        normalized_content = raw_content.to_s.sub(/\A\xEF\xBB\xBF/, "")
        rows = CSV.parse(normalized_content, headers: true, col_sep: detect_delimiter(normalized_content), encoding: Encoding::UTF_8)
        headers = rows.headers&.map { |header| header.to_s.strip }
        raise Worker::TerminalProcessingError, "csv_header_required" if headers.empty? || headers.any?(&:empty?)

        invalid_records = []
        valid_records = []

        rows.each_with_index do |row, index|
          normalized = row.to_h.transform_values { |value| value.to_s.strip }
          if normalized.values.all?(&:empty?)
            invalid_records << {
              row_number: index + 2,
              code: "empty_row",
              message: "Linha vazia no arquivo.",
              payload: normalized
            }
            next
          end

          valid_records << { row_number: index + 2, payload: normalized }
        end

        ParseResult.new(
          input_rows: rows.size,
          valid_rows: valid_records.size,
          invalid_rows: invalid_records.size,
          invalid_records: invalid_records,
          valid_records: valid_records
        )
      rescue CSV::MalformedCSVError => e
        raise Worker::TerminalProcessingError, "invalid_csv: #{e.message}"
      end

      def detect_delimiter(raw_content)
        first_line = raw_content.to_s.each_line.first.to_s
        semicolon_count = first_line.count(";")
        comma_count = first_line.count(",")
        semicolon_count > comma_count ? ";" : ","
      end

      def roo_available?
        require "roo"
        true
      rescue LoadError
        false
      end

      def with_tempfile(raw_content, extension)
        tempfile = Tempfile.new(["streamgate-parser-", extension], binmode: true)
        tempfile.write(raw_content)
        tempfile.flush
        tempfile.rewind
        yield tempfile
      ensure
        tempfile&.close!
      end

      def column_index(reference)
        letters = reference.to_s[/[A-Z]+/].to_s
        letters.chars.reduce(0) { |sum, char| sum * 26 + char.ord - "A".ord + 1 } - 1
      end

      def xlsx_cell_value(cell, shared_strings)
        value = cell.get_elements("*[local-name()='v']").first&.text.to_s
        cell.attributes["t"] == "s" ? shared_strings[value.to_i].to_s : value
      end
    end
  end
end
