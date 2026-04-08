module Uploads
  class GenerateSignedUrlService < ApplicationService
    Result = Struct.new(:storage_key, :upload_url, :required_headers, :expires_at, :reason, keyword_init: true) do
      def success?
        reason.nil?
      end
    end

    def initialize(user:, filename:, content_type:, byte_size:, checksum_sha256:, request_id: nil, trace_id: nil, storage_client: nil)
      @user = user
      @filename = filename
      @content_type = content_type
      @byte_size = byte_size
      @checksum_sha256 = checksum_sha256
      @request_id = request_id
      @trace_id = trace_id
      @storage_client = storage_client || StorageClient.new
    end

    def call
      storage_key = build_storage_key
      presigned = storage_client.presigned_put_for_upload(
        storage_key: storage_key,
        content_type: normalized_content_type,
        checksum_sha256: checksum_sha256,
        expires_in: Rails.application.config.x.upload_signed_url_ttl_seconds
      )

      return Result.new(reason: presigned.reason || :dependency_unavailable) unless presigned.success?

      Result.new(
        storage_key: storage_key,
        upload_url: presigned.upload_url,
        required_headers: presigned.required_headers,
        expires_at: presigned.expires_at
      )
    end

    private

    attr_reader :user, :filename, :content_type, :byte_size, :checksum_sha256, :request_id, :trace_id, :storage_client

    def build_storage_key
      day_partition = Time.current.utc.strftime("%Y/%m/%d")
      extension = File.extname(filename.to_s).downcase
      base = File.basename(filename.to_s, extension).presence || "upload"
      normalized_base = base.gsub(/[^a-zA-Z0-9_-]/, "_").slice(0, 80)
      token = SecureRandom.hex(8)

      "uploads/#{user.id}/#{day_partition}/#{token}-#{normalized_base}#{extension}"
    end

    def normalized_content_type
      content_type.to_s.strip.downcase
    end
  end
end
