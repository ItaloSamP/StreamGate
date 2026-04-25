# frozen_string_literal: true

require "csv"
require "json"
require "pathname"
require "zip"
require "stringio"

module Worker
  module Processing
    class CsvZipParser
      ParseResult = Struct.new(:input_rows, :valid_rows, :invalid_rows, :invalid_records, :valid_records, keyword_init: true)
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
        when "application/zip"
          parse_zip(raw_content)
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
        csv_content = nil
        Zip::File.open_buffer(StringIO.new(raw_content)) do |zip_file|
          entries = zip_file.entries.reject(&:directory?)
          raise Worker::TerminalProcessingError, "zip_too_many_entries" if entries.size > MAX_ZIP_ENTRIES

          compressed_size = [raw_content.bytesize, 1].max
          uncompressed_size = entries.sum { |entry| entry.size.to_i }
          if uncompressed_size > MAX_ZIP_UNCOMPRESSED_BYTES || uncompressed_size / compressed_size > MAX_ZIP_EXPANSION_RATIO
            raise Worker::TerminalProcessingError, "zip_bomb_suspected"
          end

          entries.each { |entry| validate_zip_entry!(entry.name) }

          csv_entries = entries.select { |entry| entry.name.downcase.end_with?(".csv") }
          raise Worker::TerminalProcessingError, "zip_without_csv" if csv_entries.empty?
          raise Worker::TerminalProcessingError, "zip_with_multiple_csv_entries" if csv_entries.size > 1

          csv_content = csv_entries.first.get_input_stream.read
        end

        parse_csv(csv_content)
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

      def invalid_record(index, code, payload)
        {
          row_number: index + 1,
          code: code,
          message: "Registro invalido no arquivo.",
          payload: payload
        }
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
    end
  end
end
