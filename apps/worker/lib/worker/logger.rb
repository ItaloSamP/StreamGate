# frozen_string_literal: true

require "logger"
require "json"

module Worker
  class JsonFormatter < ::Logger::Formatter
    def call(severity, time, progname, msg)
      payload = {
        timestamp: time.utc.iso8601,
        level: severity,
        message: msg
      }
      payload[:progname] = progname if progname
      "#{payload.to_json}\n"
    end
  end

  def self.logger
    @logger ||= begin
      log = ::Logger.new($stdout)
      log.formatter = JsonFormatter.new
      log
    end
  end
end
