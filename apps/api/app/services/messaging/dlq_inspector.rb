require "net/http"
require "uri"
require "json"
require "cgi"

module Messaging
  class DlqInspector < ApplicationService
    class InspectionError < StandardError; end

    Result = Struct.new(:messages, :queue_depth, keyword_init: true)

    def initialize(limit:, queue_name:, vhost:, management_url:, username:, password:)
      @limit = limit
      @queue_name = queue_name
      @vhost = vhost
      @management_url = management_url
      @username = username
      @password = password
    end

    def call
      uri = URI.parse("#{management_url}/queues/#{escaped_vhost}/#{escaped_queue}/get")
      request = Net::HTTP::Post.new(uri)
      request.basic_auth(username, password)
      request["Content-Type"] = "application/json"
      request.body = {
        count: limit,
        ackmode: "ack_requeue_true",
        encoding: "auto",
        truncate: 50_000
      }.to_json

      response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https") do |http|
        http.request(request)
      end

      unless response.is_a?(Net::HTTPSuccess)
        raise InspectionError, "dlq inspection failed with status=#{response.code}"
      end

      parsed = JSON.parse(response.body)
      messages = parsed.map { |item| normalize_message(item) }
      queue_depth = parsed.first&.fetch("message_count", 0).to_i + messages.size
      Result.new(messages: messages, queue_depth: queue_depth)
    rescue JSON::ParserError => error
      raise InspectionError, "dlq inspection parse error: #{error.message}"
    end

    private

    attr_reader :limit, :queue_name, :vhost, :management_url, :username, :password

    def escaped_queue
      CGI.escape(queue_name)
    end

    def escaped_vhost
      CGI.escape(vhost)
    end

    def normalize_message(item)
      payload = item["payload"]
      parsed_payload = payload.is_a?(String) ? JSON.parse(payload) : payload
      headers = item.dig("properties", "headers") || {}

      {
        payload: parsed_payload,
        exchange: item["exchange"],
        routing_key: item["routing_key"],
        redelivered: item["redelivered"],
        retry_count: headers["x-retry-count"].to_i,
        dead_letter_reason: headers["x-dead-letter-reason"],
        headers: headers
      }
    rescue JSON::ParserError
      {
        payload: payload.to_s,
        exchange: item["exchange"],
        routing_key: item["routing_key"],
        redelivered: item["redelivered"],
        retry_count: 0,
        dead_letter_reason: nil,
        headers: item.dig("properties", "headers") || {}
      }
    end
  end
end
