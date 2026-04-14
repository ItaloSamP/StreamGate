# frozen_string_literal: true

require "csv"
require "zip"
require "stringio"

module Worker
  module Processing
    class CsvZipParser
      ParseResult = Struct.new(:input_rows, :valid_rows, :invalid_rows, :invalid_records, keyword_init: true)

      def parse(content_type:, raw_content:)
        if content_type == "text/csv"
          parse_csv(raw_content)
        elsif content_type == "application/zip"
          parse_zip(raw_content)
        else
          raise Worker::TerminalProcessingError, "unsupported content_type=#{content_type}"
        end
      end

      private

      def parse_zip(raw_content)
        csv_content = nil
        Zip::File.open_buffer(StringIO.new(raw_content)) do |zip_file|
          csv_entries = zip_file.entries.reject(&:directory?).select { |entry| entry.name.downcase.end_with?(".csv") }
          raise Worker::TerminalProcessingError, "zip_without_csv" if csv_entries.empty?
          raise Worker::TerminalProcessingError, "zip_with_multiple_csv_entries" if csv_entries.size > 1

          csv_content = csv_entries.first.get_input_stream.read
        end

        parse_csv(csv_content)
      end

      def parse_csv(raw_content)
        normalized_content = raw_content.to_s.sub(/\A\xEF\xBB\xBF/, "")
        rows = CSV.parse(normalized_content, headers: true, col_sep: detect_delimiter(normalized_content), encoding: Encoding::UTF_8)
        headers = rows.headers&.map { |header| header.to_s.strip }
        if headers.empty? || headers.any? { |header| header.empty? }
          raise Worker::TerminalProcessingError, "csv_header_required"
        end

        invalid_records = []
        valid_rows = 0

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

          valid_rows += 1
        end

        ParseResult.new(
          input_rows: rows.size,
          valid_rows: valid_rows,
          invalid_rows: invalid_records.size,
          invalid_records: invalid_records
        )
      rescue CSV::MalformedCSVError => error
        raise Worker::TerminalProcessingError, "invalid_csv: #{error.message}"
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
