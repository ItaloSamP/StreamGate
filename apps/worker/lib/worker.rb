# frozen_string_literal: true

require_relative "worker/version"
require_relative "worker/config"
require_relative "worker/id"
require_relative "worker/runtime/errors"
require_relative "worker/runtime/db_client"
require_relative "worker/runtime/storage_client"
require_relative "worker/runtime/artifact_writer"
require_relative "worker/runtime/operational_notifier"
require_relative "worker/runtime/public_link_fetcher"
require_relative "worker/processing/csv_zip_parser"
require_relative "worker/runtime/upload_received_processor"
require_relative "worker/runtime/public_link_requested_processor"
require_relative "worker/runtime/consumer"

module Worker
  class Error < StandardError; end

  def self.run!
    Runtime::Consumer.new.run
  end
end
