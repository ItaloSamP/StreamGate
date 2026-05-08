# frozen_string_literal: true

require "net/http"
require "tempfile"
require "uri"

module Worker
  module Runtime
    class GoogleDriveClient
      DOWNLOAD_ENDPOINT = "https://www.googleapis.com/drive/v3/files/%<file_id>s?alt=media"

      def download_file(access_token:, file_id:)
        uri = URI(format(DOWNLOAD_ENDPOINT, file_id: URI.encode_www_form_component(file_id)))
        tempfile = Tempfile.new(["streamgate-google-drive-", ".bin"], binmode: true)
        request = Net::HTTP::Get.new(uri)
        request["Authorization"] = "Bearer #{access_token}"

        Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 5, read_timeout: 60) do |http|
          http.request(request) do |response|
            raise TransientProcessingError, "google_drive_download_status=#{response.code}" unless response.is_a?(Net::HTTPSuccess)

            response.read_body { |chunk| tempfile.write(chunk) }
          end
        end
        tempfile
      rescue StandardError
        tempfile&.close!
        raise
      end
    end
  end
end
