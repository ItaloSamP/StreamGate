# frozen_string_literal: true

require "aws-sdk-s3"

module Worker
  module Runtime
    class StorageClient
      def initialize(config:)
        @config = config
        @client = Aws::S3::Client.new(
          endpoint: config.storage_endpoint,
          region: config.storage_region,
          access_key_id: config.storage_access_key,
          secret_access_key: config.storage_secret_key,
          force_path_style: true
        )
      end

      def read_object(storage_key:)
        response = client.get_object(bucket: config.storage_bucket, key: storage_key)
        response.body.read
      end

      private

      attr_reader :config, :client
    end
  end
end
