require "cgi"
require "digest"
require "net/http"
require "openssl"
require "uri"

module Uploads
  class StorageClient
    PresignedUrlResult = Struct.new(:upload_url, :required_headers, :expires_at, :reason, keyword_init: true) do
      def success?
        reason.nil?
      end
    end

    HeadObjectResult = Struct.new(:exists, :content_length, :content_type, :checksum_sha256, :reason, keyword_init: true) do
      def success?
        reason.nil?
      end

      def exists?
        exists
      end
    end

    def initialize(endpoint: nil, bucket: nil, region: nil, access_key: nil, secret_key: nil)
      @endpoint = URI.parse(endpoint || Rails.application.config.x.upload_storage_endpoint)
      @bucket = bucket || Rails.application.config.x.upload_storage_bucket
      @region = region || Rails.application.config.x.upload_storage_region
      @access_key = access_key || Rails.application.config.x.upload_storage_access_key
      @secret_key = secret_key || Rails.application.config.x.upload_storage_secret_key
    rescue URI::InvalidURIError
      @endpoint = nil
    end

    def presigned_put_for_upload(storage_key:, content_type:, checksum_sha256:, expires_in:)
      return PresignedUrlResult.new(reason: :dependency_unavailable) unless configured?

      required_headers = {
        "Content-Type" => content_type,
        "x-amz-meta-checksum-sha256" => checksum_sha256
      }

      upload_url = build_presigned_url(
        method: "PUT",
        storage_key: storage_key,
        expires_in: expires_in,
        signed_headers: {
          "content-type" => content_type,
          "x-amz-meta-checksum-sha256" => checksum_sha256
        }
      )

      PresignedUrlResult.new(
        upload_url: upload_url,
        required_headers: required_headers,
        expires_at: Time.current + expires_in.to_i
      )
    rescue StandardError => error
      Rails.logger.warn("uploads.storage_client.presign_failed reason=#{error.class} message=#{error.message}")
      PresignedUrlResult.new(reason: :dependency_unavailable)
    end

    def head_object(storage_key:)
      return HeadObjectResult.new(reason: :dependency_unavailable) unless configured?

      url = build_presigned_url(method: "HEAD", storage_key: storage_key, expires_in: 60, signed_headers: {})
      uri = URI.parse(url)

      response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https") do |http|
        request = Net::HTTP::Head.new(uri)
        http.request(request)
      end

      case response
      when Net::HTTPSuccess
        HeadObjectResult.new(
          exists: true,
          content_length: response["content-length"].to_i,
          content_type: response["content-type"].to_s,
          checksum_sha256: response["x-amz-meta-checksum-sha256"].to_s.downcase.presence
        )
      when Net::HTTPNotFound
        HeadObjectResult.new(exists: false)
      else
        HeadObjectResult.new(reason: :dependency_unavailable)
      end
    rescue StandardError => error
      Rails.logger.warn("uploads.storage_client.head_failed reason=#{error.class} message=#{error.message}")
      HeadObjectResult.new(reason: :dependency_unavailable)
    end

    private

    attr_reader :endpoint, :bucket, :region, :access_key, :secret_key

    def configured?
      endpoint.present? && bucket.present? && region.present? && access_key.present? && secret_key.present?
    end

    def build_presigned_url(method:, storage_key:, expires_in:, signed_headers:)
      now = Time.current.utc
      amz_date = now.strftime("%Y%m%dT%H%M%SZ")
      date_stamp = now.strftime("%Y%m%d")
      credential_scope = "#{date_stamp}/#{region}/s3/aws4_request"

      canonical_uri = "/#{aws_encode(bucket, encode_slash: false)}/#{aws_encode(storage_key, encode_slash: true)}"
      canonical_headers = normalized_signed_headers(signed_headers)
      signed_headers_value = canonical_headers.keys.sort.join(";")
      canonical_headers_value = canonical_headers.keys.sort.map { |name| "#{name}:#{canonical_headers[name]}\n" }.join

      query_params = {
        "X-Amz-Algorithm" => "AWS4-HMAC-SHA256",
        "X-Amz-Credential" => "#{access_key}/#{credential_scope}",
        "X-Amz-Date" => amz_date,
        "X-Amz-Expires" => expires_in.to_i.to_s,
        "X-Amz-SignedHeaders" => signed_headers_value
      }

      canonical_query = canonical_query_string(query_params)
      canonical_request = [
        method,
        canonical_uri,
        canonical_query,
        canonical_headers_value,
        signed_headers_value,
        "UNSIGNED-PAYLOAD"
      ].join("\n")

      string_to_sign = [
        "AWS4-HMAC-SHA256",
        amz_date,
        credential_scope,
        Digest::SHA256.hexdigest(canonical_request)
      ].join("\n")

      signature = OpenSSL::HMAC.hexdigest("sha256", signing_key(date_stamp), string_to_sign)
      signed_query = "#{canonical_query}&X-Amz-Signature=#{signature}"

      base = endpoint.dup
      base.path = canonical_uri
      base.query = signed_query
      base.to_s
    end

    def normalized_signed_headers(headers)
      host = endpoint.port.present? && !default_port?(endpoint) ? "#{endpoint.host}:#{endpoint.port}" : endpoint.host
      normalized = { "host" => host }
      headers.each do |name, value|
        normalized[name.to_s.strip.downcase] = value.to_s.strip
      end
      normalized
    end

    def default_port?(uri)
      (uri.scheme == "https" && uri.port == 443) || (uri.scheme == "http" && uri.port == 80)
    end

    def canonical_query_string(params)
      params
        .sort_by { |key, _| key }
        .map { |key, value| "#{aws_encode(key, encode_slash: false)}=#{aws_encode(value, encode_slash: false)}" }
        .join("&")
    end

    def signing_key(date_stamp)
      date_key = OpenSSL::HMAC.digest("sha256", "AWS4#{secret_key}", date_stamp)
      region_key = OpenSSL::HMAC.digest("sha256", date_key, region)
      service_key = OpenSSL::HMAC.digest("sha256", region_key, "s3")
      OpenSSL::HMAC.digest("sha256", service_key, "aws4_request")
    end

    def aws_encode(value, encode_slash:)
      encoded = CGI.escape(value.to_s).gsub("+", "%20").gsub("%7E", "~")
      encode_slash ? encoded.gsub("%2F", "/") : encoded
    end
  end
end
