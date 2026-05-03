# frozen_string_literal: true

require "json"
require "net/http"
require "uri"

module Worker
  module Runtime
    class ConnectorLeaseClient
      def initialize(config:)
        @config = config
      end

      def claim(lease_id:, lease_token:)
        uri = URI.join(config.worker_internal_api_url, "/api/v1/internal/connectors/leases/#{lease_id}/claim")
        request = Net::HTTP::Post.new(uri)
        request["Content-Type"] = "application/json"
        request["X-Worker-Token"] = config.worker_internal_token
        request["X-Connector-Lease-Token"] = lease_token
        request.body = { lease: { token: lease_token } }.to_json

        response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", open_timeout: 5, read_timeout: 15) do |http|
          http.request(request)
        end
        raise TransientProcessingError, "connector_lease_status=#{response.code}" unless response.is_a?(Net::HTTPSuccess)

        JSON.parse(response.body).fetch("data")
      rescue JSON::ParserError, KeyError => e
        raise TerminalProcessingError, "invalid_connector_lease_response: #{e.message}"
      rescue SocketError, Timeout::Error, Errno::ECONNREFUSED => e
        raise TransientProcessingError, "connector_lease_unavailable: #{e.class.name}"
      end

      private

      attr_reader :config
    end
  end
end
