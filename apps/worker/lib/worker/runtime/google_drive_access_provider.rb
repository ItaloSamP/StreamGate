# frozen_string_literal: true

require "json"
require "net/http"
require "uri"

module Worker
  module Runtime
    class GoogleDriveAccessProvider
      def initialize(config: Config.new)
        @config = config
      end

      def access_token_for(oauth_connection_id)
        uri = URI.join(config.worker_internal_api_url, "/api/v1/internal/connectors/google-drive/oauth-connections/#{oauth_connection_id}/access-token")
        request = Net::HTTP::Post.new(uri)
        request["X-Worker-Token"] = config.worker_internal_token
        request["Content-Type"] = "application/json"
        response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https") { |http| http.request(request) }
        raise TransientProcessingError, "google_drive_access_token_status=#{response.code}" unless response.is_a?(Net::HTTPSuccess)

        JSON.parse(response.body).fetch("data").fetch("access_token")
      rescue JSON::ParserError, KeyError => e
        raise TransientProcessingError, "google_drive_access_token_invalid_response: #{e.class.name}"
      end

      private

      attr_reader :config
    end
  end
end
