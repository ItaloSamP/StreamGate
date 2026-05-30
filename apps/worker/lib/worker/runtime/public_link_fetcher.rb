# frozen_string_literal: true

require "digest"
require "ipaddr"
require "net/http"
require "stringio"
require "tempfile"
require "uri"

module Worker
  module Runtime
    class PublicLinkFetcher
      HttpResponse = Struct.new(:status, :headers, :body, :final_url, keyword_init: true)
      Result = Struct.new(:content_type, :byte_size, :checksum_sha256, :final_url, keyword_init: true)

      SAFE_SCHEMES = %w[http https].freeze
      SAFE_PORTS = [80, 443].freeze
      REDIRECT_STATUSES = [301, 302, 303, 307, 308].freeze
      MAX_REDIRECTS = 3
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

      def initialize(storage_client:, max_bytes:, resolver: nil, http_client: nil, scanner: nil)
        @storage_client = storage_client
        @max_bytes = max_bytes
        @resolver = resolver || method(:resolve_host)
        @http_client = http_client || NetHttpClient.new
        @scanner = scanner
      end

      def call(url:, storage_key:)
        validate_public_url!(url)
        head = request_with_redirects(:head, url)
        content_length = header(head.headers, "content-length").to_i
        raise TerminalProcessingError, "public_link_too_large" if content_length.positive? && content_length > max_bytes

        response = request_with_redirects(:get, head.final_url || url)
        raise TerminalProcessingError, "public_link_http_status=#{response.status}" unless response.status.to_i.between?(200, 299)

        content_type = normalize_content_type(header(response.headers, "content-type"), response.final_url || head.final_url || url)
        tempfile = Tempfile.new(["streamgate-public-link-", ".bin"], binmode: true)
        digest = Digest::SHA256.new
        byte_size = stream_body(response.body, tempfile, digest)

        scan_download!(tempfile)
        tempfile.rewind
        storage_client.write_object_stream(storage_key: storage_key, io: tempfile, content_type: content_type)

        Result.new(
          content_type: content_type,
          byte_size: byte_size,
          checksum_sha256: digest.hexdigest,
          final_url: response.final_url || url
        )
      ensure
        tempfile&.close!
      end

      private

      attr_reader :storage_client, :max_bytes, :resolver, :http_client, :scanner

      def scan_download!(tempfile)
        return if scanner.nil?

        tempfile.rewind
        result = scanner.scan_io(tempfile)
        raise TerminalProcessingError, "public_link_malware_detected" if result.infected?
      ensure
        tempfile.rewind
      end

      def request_with_redirects(method, url)
        current_url = url
        MAX_REDIRECTS.succ.times do |redirect_index|
          validate_public_url!(current_url)
          response = http_client.public_send(method, current_url)
          response.final_url ||= current_url
          return response unless REDIRECT_STATUSES.include?(response.status.to_i)

          location = header(response.headers, "location")
          raise TerminalProcessingError, "public_link_redirect_missing_location" if location.to_s.empty?
          raise TerminalProcessingError, "public_link_too_many_redirects" if redirect_index >= MAX_REDIRECTS

          current_url = URI.join(current_url, location).to_s
        end
      end

      def validate_public_url!(url)
        uri = URI.parse(url.to_s)
        raise TerminalProcessingError, "public_link_url_not_public" unless SAFE_SCHEMES.include?(uri.scheme)
        raise TerminalProcessingError, "public_link_url_not_public" if uri.host.to_s.empty? || uri.userinfo
        raise TerminalProcessingError, "public_link_url_not_public" if uri.port && !SAFE_PORTS.include?(uri.port)

        host = uri.host.downcase.delete_suffix(".")
        raise TerminalProcessingError, "public_link_url_not_public" if BLOCKED_HOSTS.include?(host) || host.end_with?(".localhost")

        addresses = resolver.call(host)
        raise TerminalProcessingError, "public_link_url_not_public" if addresses.empty?
        raise TerminalProcessingError, "public_link_url_not_public" if addresses.any? { |address| blocked_ip?(address) }
      rescue URI::InvalidURIError, IPAddr::InvalidAddressError
        raise TerminalProcessingError, "public_link_url_not_public"
      end

      def resolve_host(host)
        Addrinfo.getaddrinfo(host, nil).map(&:ip_address).uniq
      end

      def blocked_ip?(address)
        ip = IPAddr.new(address)
        BLOCKED_IP_RANGES.any? { |range| range.include?(ip) }
      end

      def stream_body(body, tempfile, digest)
        byte_size = 0
        while (chunk = body.read(64 * 1024))
          byte_size += chunk.bytesize
          raise TerminalProcessingError, "public_link_too_large" if byte_size > max_bytes

          digest.update(chunk)
          tempfile.write(chunk)
        end
        byte_size
      end

      def normalize_content_type(value, url)
        normalized = value.to_s.split(";").first.to_s.strip.downcase
        return "text/csv" if %w[text/plain application/octet-stream].include?(normalized) && URI.parse(url).path.downcase.end_with?(".csv")

        normalized.empty? ? "application/octet-stream" : normalized
      end

      def header(headers, name)
        headers.fetch(name, headers.fetch(name.downcase, headers.fetch(name.upcase, nil)))
      end

      class NetHttpClient
        def head(url)
          request(url, Net::HTTP::Head)
        end

        def get(url)
          request(url, Net::HTTP::Get)
        end

        private

        def request(url, klass)
          uri = URI.parse(url)
          response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", open_timeout: 10, read_timeout: 60) do |http|
            http.request(klass.new(uri))
          end

          HttpResponse.new(
            status: response.code.to_i,
            headers: response.each_header.to_h,
            body: StringIO.new(response.body.to_s),
            final_url: url
          )
        rescue Timeout::Error, IOError, SystemCallError => e
          raise TransientProcessingError, "public_link_network_error: #{e.class.name}"
        end
      end
    end
  end
end
