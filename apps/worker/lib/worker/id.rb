# frozen_string_literal: true

require "securerandom"

module Worker
  module Id
    module_function

    def generate(prefix)
      raise ArgumentError, "prefix is required" if prefix.to_s.strip.empty?

      "#{prefix}_#{SecureRandom.uuid.delete('-')}"
    end
  end
end
