require "digest"
require "ipaddr"
require "uri"

module Uploads
  class PublicLinkUrlPolicy
    SAFE_SCHEMES = %w[http https].freeze
    SAFE_PORTS = [ 80, 443 ].freeze
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

    Result = Struct.new(:valid, :uri, :reason, keyword_init: true) do
      def valid?
        valid
      end
    end

    def self.validate(url)
      uri = URI.parse(url.to_s.strip)
      return Result.new(valid: false, reason: "invalid_scheme") unless SAFE_SCHEMES.include?(uri.scheme)
      return Result.new(valid: false, reason: "blank_host") if uri.host.blank?
      return Result.new(valid: false, reason: "userinfo_not_allowed") if uri.userinfo.present?
      return Result.new(valid: false, reason: "non_standard_port") if uri.port.present? && !SAFE_PORTS.include?(uri.port)
      return Result.new(valid: false, reason: "blocked_host") if blocked_host?(uri.host)

      Result.new(valid: true, uri: uri)
    rescue URI::InvalidURIError
      Result.new(valid: false, reason: "invalid")
    end

    def self.mask(url)
      uri = URI.parse(url.to_s.strip)
      uri.query = nil
      uri.fragment = nil
      uri.user = nil
      uri.password = nil
      uri.to_s
    rescue URI::InvalidURIError
      ""
    end

    def self.hash(url)
      Digest::SHA256.hexdigest(url.to_s.strip)
    end

    def self.blocked_host?(host)
      normalized = host.to_s.downcase.delete_suffix(".")
      return true if BLOCKED_HOSTS.include?(normalized)
      return true if normalized.end_with?(".localhost")

      ip = IPAddr.new(normalized)
      BLOCKED_IP_RANGES.any? { |range| range.include?(ip) }
    rescue IPAddr::InvalidAddressError
      false
    end
  end
end
