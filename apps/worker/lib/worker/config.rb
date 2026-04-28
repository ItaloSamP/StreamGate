# frozen_string_literal: true

module Worker
  class Config
    attr_reader :broker_host,
                :broker_port,
                :broker_username,
                :broker_password,
                :broker_vhost,
                :exchange_name,
                :routing_key,
                :queue_name,
                :dlq_queue_name,
                :dlq_routing_key,
                :public_link_routing_key,
                :public_link_queue_name,
                :public_link_dlq_queue_name,
                :public_link_dlq_routing_key,
                :max_retries,
                :public_link_max_bytes,
                :postgres_host,
                :postgres_port,
                :postgres_db,
                :postgres_user,
                :postgres_password,
                :storage_endpoint,
                :storage_region,
                :storage_bucket,
                :storage_access_key,
                :storage_secret_key,
                :job_artifact_retention_days,
                :notification_retention_days,
                :clickhouse_http_url,
                :clickhouse_db,
                :clickhouse_user,
                :clickhouse_password,
                :clickhouse_hmac_secret,
                :clickhouse_ttl_days

    def initialize(env: ENV)
      @broker_host = env.fetch("BROKER_HOST", "rabbitmq")
      @broker_port = env.fetch("BROKER_PORT", "5672").to_i
      @broker_username = env.fetch("BROKER_USERNAME", env.fetch("RABBITMQ_DEFAULT_USER", "streamgate"))
      @broker_password = env.fetch("BROKER_PASSWORD", env.fetch("RABBITMQ_DEFAULT_PASS", "streamgate123"))
      @broker_vhost = env.fetch("BROKER_VHOST", "/")
      @exchange_name = env.fetch("BROKER_EXCHANGE", "streamgate.events")
      @routing_key = env.fetch("BROKER_UPLOAD_RECEIVED_ROUTING_KEY", "upload.received.v1")
      @queue_name = env.fetch("BROKER_UPLOAD_RECEIVED_QUEUE", "streamgate.worker.upload.received.v1")
      @dlq_queue_name = env.fetch("BROKER_UPLOAD_RECEIVED_DLQ", "streamgate.worker.upload.received.v1.dlq")
      @dlq_routing_key = env.fetch("BROKER_UPLOAD_RECEIVED_DLQ_ROUTING_KEY", "upload.received.v1.dlq")
      @public_link_routing_key = env.fetch("BROKER_PUBLIC_LINK_REQUESTED_ROUTING_KEY", "upload.public_link.requested.v1")
      @public_link_queue_name = env.fetch("BROKER_PUBLIC_LINK_REQUESTED_QUEUE", "streamgate.worker.upload.public_link.requested.v1")
      @public_link_dlq_queue_name = env.fetch("BROKER_PUBLIC_LINK_REQUESTED_DLQ", "streamgate.worker.upload.public_link.requested.v1.dlq")
      @public_link_dlq_routing_key = env.fetch("BROKER_PUBLIC_LINK_REQUESTED_DLQ_ROUTING_KEY", "upload.public_link.requested.v1.dlq")
      @max_retries = env.fetch("WORKER_MAX_RETRIES", "3").to_i
      @public_link_max_bytes = env.fetch("PUBLIC_LINK_MAX_BYTES", (10 * 1024 * 1024 * 1024).to_s).to_i

      @postgres_host = env.fetch("POSTGRES_HOST", "postgres")
      @postgres_port = env.fetch("POSTGRES_PORT", "5432").to_i
      @postgres_db = env.fetch("POSTGRES_DB", "streamgate")
      @postgres_user = env.fetch("POSTGRES_USER", "streamgate")
      @postgres_password = env.fetch("POSTGRES_PASSWORD", "streamgate123")

      @storage_endpoint = env.fetch("UPLOAD_STORAGE_ENDPOINT", "http://minio:9000")
      @storage_region = env.fetch("UPLOAD_STORAGE_REGION", "us-east-1")
      @storage_bucket = env.fetch("UPLOAD_STORAGE_BUCKET", "streamgate-uploads")
      @storage_access_key = env.fetch("UPLOAD_STORAGE_ACCESS_KEY", env.fetch("MINIO_ROOT_USER", "streamgate"))
      @storage_secret_key = env.fetch("UPLOAD_STORAGE_SECRET_KEY", env.fetch("MINIO_ROOT_PASSWORD", "streamgate123"))
      @job_artifact_retention_days = env.fetch("JOB_ARTIFACT_RETENTION_DAYS", "30").to_i
      @notification_retention_days = env.fetch("NOTIFICATION_RETENTION_DAYS", "30").to_i
      @clickhouse_http_url = env.fetch("CLICKHOUSE_HTTP_URL", "http://clickhouse:8123")
      @clickhouse_db = env.fetch("CLICKHOUSE_DB", "streamgate")
      @clickhouse_user = env.fetch("CLICKHOUSE_USER", "default")
      @clickhouse_password = env.fetch("CLICKHOUSE_PASSWORD", "")
      @clickhouse_hmac_secret = env.fetch("CLICKHOUSE_HMAC_SECRET", "streamgate-dev-clickhouse-hmac-secret")
      @clickhouse_ttl_days = env.fetch("CLICKHOUSE_TTL_DAYS", "30").to_i
    end
  end
end
