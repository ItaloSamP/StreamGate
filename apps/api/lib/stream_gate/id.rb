require "securerandom"

module StreamGate
  module Id
    module_function

    def generate(prefix)
      raise ArgumentError, "prefix is required" if prefix.blank?

      "#{prefix}_#{SecureRandom.uuid.delete('-')}"
    end
  end
end
