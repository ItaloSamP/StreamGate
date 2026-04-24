module UploadRuntime
  module_function

  BOOLEAN = ActiveModel::Type::Boolean.new
  INTEGER = ActiveModel::Type::Integer.new

  def storage_endpoint
    ENV.fetch("UPLOAD_STORAGE_ENDPOINT", "http://minio:9000")
  end

  def storage_bucket
    ENV.fetch("UPLOAD_STORAGE_BUCKET", "streamgate-uploads")
  end

  def storage_region
    ENV.fetch("UPLOAD_STORAGE_REGION", "us-east-1")
  end

  def storage_access_key
    ENV.fetch("UPLOAD_STORAGE_ACCESS_KEY", ENV.fetch("MINIO_ROOT_USER", "streamgate"))
  end

  def storage_secret_key
    ENV.fetch("UPLOAD_STORAGE_SECRET_KEY", ENV.fetch("MINIO_ROOT_PASSWORD", "streamgate123"))
  end

  def signed_url_ttl_seconds
    env_integer("UPLOAD_SIGNED_URL_TTL_SECONDS", 900)
  end

  def signed_url_mode
    ENV.fetch("UPLOAD_SIGNED_URL_MODE", "presigned_put")
  end

  def signed_url_limit_per_ip
    env_integer("UPLOAD_SIGNED_URL_LIMIT_PER_IP", 30)
  end

  def register_limit_per_ip
    env_integer("UPLOAD_REGISTER_LIMIT_PER_IP", 30)
  end

  def throttle_window_seconds
    env_integer("UPLOAD_THROTTLE_WINDOW_SECONDS", 60)
  end

  def allowed_content_types
    ENV.fetch("UPLOAD_ALLOWED_CONTENT_TYPES", "application/json,application/zip,text/csv")
      .split(",")
      .map { |value| value.to_s.strip.downcase }
      .reject(&:blank?)
      .uniq
  end

  def max_byte_size
    env_integer("UPLOAD_MAX_BYTE_SIZE", 10.gigabytes)
  end

  def verify_object_before_register?
    BOOLEAN.cast(ENV.fetch("UPLOAD_VERIFY_OBJECT_BEFORE_REGISTER", "true"))
  end

  def env_integer(key, fallback)
    parsed = INTEGER.cast(ENV.fetch(key, fallback.to_s))
    parsed.present? && parsed.positive? ? parsed : fallback
  end
end

Rails.application.config.x.upload_storage_endpoint = UploadRuntime.storage_endpoint
Rails.application.config.x.upload_storage_bucket = UploadRuntime.storage_bucket
Rails.application.config.x.upload_storage_region = UploadRuntime.storage_region
Rails.application.config.x.upload_storage_access_key = UploadRuntime.storage_access_key
Rails.application.config.x.upload_storage_secret_key = UploadRuntime.storage_secret_key
Rails.application.config.x.upload_signed_url_ttl_seconds = UploadRuntime.signed_url_ttl_seconds
Rails.application.config.x.upload_signed_url_mode = UploadRuntime.signed_url_mode
Rails.application.config.x.upload_signed_url_limit_per_ip = UploadRuntime.signed_url_limit_per_ip
Rails.application.config.x.upload_register_limit_per_ip = UploadRuntime.register_limit_per_ip
Rails.application.config.x.upload_throttle_window_seconds = UploadRuntime.throttle_window_seconds
Rails.application.config.x.upload_allowed_content_types = UploadRuntime.allowed_content_types
Rails.application.config.x.upload_max_byte_size = UploadRuntime.max_byte_size
Rails.application.config.x.upload_verify_object_before_register = UploadRuntime.verify_object_before_register?
