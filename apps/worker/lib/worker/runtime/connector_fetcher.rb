# frozen_string_literal: true

require "aws-sdk-s3"
require "digest"
require "ipaddr"
require "net/http"
require "socket"
require "tempfile"
require "uri"

module Worker
  module Runtime
    class ConnectorFetcher
      SAFE_PORTS = [80, 443].freeze
      BLOCKED_HOSTS = %w[localhost localhost.localdomain metadata.google.internal].freeze
      BLOCKED_IP_RANGES = [
        IPAddr.new("0.0.0.0/8"),
        IPAddr.new("10.0.0.0/8"),
        IPAddr.new("127.0.0.0/8"),
        IPAddr.new("169.254.0.0/16"),
        IPAddr.new("172.16.0.0/12"),
        IPAddr.new("192.168.0.0/16"),
        IPAddr.new("::1/128"),
        IPAddr.new("fc00::/7"),
        IPAddr.new("fe80::/10")
      ].freeze

      Result = Struct.new(:io, :content_type, :byte_size, :checksum_sha256, keyword_init: true)

      def call(connector:, ingestion:)
        case connector.fetch("kind")
        when "s3"
          fetch_s3(connector, ingestion)
        when "http"
          fetch_http(connector, ingestion)
        else
          raise TerminalProcessingError, "unsupported_connector_kind=#{connector.fetch("kind")}"
        end
      end

      private

      def fetch_s3(connector, ingestion)
        settings = connector.fetch("settings")
        secrets = connector.fetch("secrets", {})
        tempfile = Tempfile.new(["streamgate-connector-s3-", ".bin"], binmode: true)
        client = Aws::S3::Client.new(
          endpoint: settings["endpoint"],
          region: settings.fetch("region", "us-east-1"),
          access_key_id: secrets["access_key_id"],
          secret_access_key: secrets["secret_access_key"],
          force_path_style: true
        )
        client.get_object({ bucket: settings.fetch("bucket"), key: ingestion.fetch("object_key") }, target: tempfile.path)
        build_result(tempfile, ingestion.fetch("content_type"))
      rescue Aws::S3::Errors::ServiceError, Seahorse::Client::NetworkingError => e
        tempfile&.close!
        raise TransientProcessingError, "connector_s3_fetch_failed: #{e.class.name}"
      rescue KeyError => e
        tempfile&.close!
        raise TerminalProcessingError, "connector_s3_missing_key: #{e.message}"
      end

      def fetch_http(connector, ingestion)
        url = ingestion["source_path"].to_s.empty? ? connector.fetch("settings").fetch("url") : ingestion.fetch("source_path")
        uri = validate_uri!(url)
        tempfile = Tempfile.new(["streamgate-connector-http-", ".bin"], binmode: true)

        Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", open_timeout: 5, read_timeout: 30) do |http|
          request = Net::HTTP::Get.new(uri)
          connector.fetch("secrets", {}).fetch("headers", {}).each do |key, value|
            request[key.to_s] = value.to_s
          end
          http.request(request) do |res|
            raise TerminalProcessingError, "connector_http_status=#{res.code}" unless res.is_a?(Net::HTTPSuccess)

            res.read_body { |chunk| tempfile.write(chunk) }
          end
        end
        build_result(tempfile, ingestion.fetch("content_type"))
      rescue SocketError, Timeout::Error, Errno::ECONNREFUSED => e
        tempfile&.close!
        raise TransientProcessingError, "connector_http_fetch_failed: #{e.class.name}"
      end

      def validate_uri!(url)
        uri = URI.parse(url)
        raise TerminalProcessingError, "connector_http_invalid_scheme" unless %w[http https].include?(uri.scheme)
        raise TerminalProcessingError, "connector_http_blank_host" if uri.host.to_s.empty?
        raise TerminalProcessingError, "connector_http_userinfo_not_allowed" if uri.userinfo
        raise TerminalProcessingError, "connector_http_non_standard_port" if uri.port && !SAFE_PORTS.include?(uri.port)
        raise TerminalProcessingError, "connector_http_blocked_host" if blocked_host?(uri.host)
        raise TerminalProcessingError, "connector_http_blocked_address" if private_resolved_address?(uri.host)

        uri
      rescue URI::InvalidURIError
        raise TerminalProcessingError, "connector_http_invalid_url"
      rescue SocketError
        raise TransientProcessingError, "connector_http_dns_unavailable"
      end

      def blocked_host?(host)
        normalized = host.to_s.downcase.delete_suffix(".")
        return true if BLOCKED_HOSTS.include?(normalized)
        return true if normalized.end_with?(".localhost")

        ip = IPAddr.new(normalized)
        BLOCKED_IP_RANGES.any? { |range| range.include?(ip) }
      rescue IPAddr::InvalidAddressError
        false
      end

      def private_resolved_address?(host)
        Addrinfo.getaddrinfo(host, nil).any? do |info|
          address = IPAddr.new(info.ip_address)
          BLOCKED_IP_RANGES.any? { |range| range.include?(address) }
        end
      end

      def build_result(tempfile, content_type)
        tempfile.flush
        tempfile.rewind
        checksum = Digest::SHA256.file(tempfile.path).hexdigest
        Result.new(io: tempfile, content_type: content_type, byte_size: File.size(tempfile.path), checksum_sha256: checksum)
      end
    end
  end
end
