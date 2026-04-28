module Audit
  class MetadataSanitizer
    ALLOWED_KEYS = %w[
      action
      actor_id
      attempt_id
      batch_id
      byte_size
      checksum_sha256
      correlation_id
      error_category
      error_code
      event_id
      event_name
      filename
      input_rows
      invalid_rows
      job_id
      link_mode
      request_id
      retryable
      source
      source_host
      source_type
      status
      trace_id
      upload_id
      url_hash
      valid_rows
    ].freeze

    MASKED_VALUE = "[REDACTED]".freeze

    def self.sanitize(metadata)
      return {} if metadata.blank?

      metadata.each_with_object({}) do |(key, value), acc|
        normalized = key.to_s
        if ALLOWED_KEYS.include?(normalized)
          acc[normalized] = value
        else
          acc[normalized] = MASKED_VALUE
        end
      end
    end
  end
end
