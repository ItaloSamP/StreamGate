module Operational
  class PayloadMasker
    SENSITIVE_KEY_PARTS = %w[
      authorization
      credential
      password
      secret
      token
      access_key
      api_key
      private_key
      headers
    ].freeze
    SENSITIVE_EXACT_KEYS = %w[
      bucket
      key
      object_key
      source_path
      url
    ].freeze

    MASKED_VALUE = "[masked]".freeze

    def self.call(value)
      new(value).call
    end

    def initialize(value)
      @value = value
    end

    def call
      mask(value)
    end

    private

    attr_reader :value

    def mask(current)
      case current
      when Hash
        current.each_with_object({}) do |(key, nested), acc|
          normalized = key.to_s
          acc[normalized] = sensitive_key?(normalized) ? MASKED_VALUE : mask(nested)
        end
      when Array
        current.map { |entry| mask(entry) }
      else
        current
      end
    end

    def sensitive_key?(key)
      downcased = key.downcase
      SENSITIVE_EXACT_KEYS.include?(downcased) || SENSITIVE_KEY_PARTS.any? { |part| downcased.include?(part) }
    end
  end
end
