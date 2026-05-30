# frozen_string_literal: true

module Worker
  class ProcessingError < StandardError; end
  class TransientProcessingError < ProcessingError; end
  class TerminalProcessingError < ProcessingError; end
end
