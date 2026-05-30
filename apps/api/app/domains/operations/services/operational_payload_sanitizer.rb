class OperationalPayloadSanitizer
  MASKED_VALUE = "[REDACTED]".freeze
  SENSITIVE_KEY_PATTERN = /(password|token|secret|credential|authorization|cookie|cpf|ssn|document|email|phone|signed_url|signature)/i

  def self.sanitize(value)
    case value
    when Array
      value.map { |entry| sanitize(entry) }
    when Hash
      value.each_with_object({}) do |(key, entry), acc|
        normalized_key = key.to_s
        acc[normalized_key] = SENSITIVE_KEY_PATTERN.match?(normalized_key) ? MASKED_VALUE : sanitize(entry)
      end
    else
      value
    end
  end
end
