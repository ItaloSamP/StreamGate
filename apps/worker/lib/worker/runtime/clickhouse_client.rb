# frozen_string_literal: true

require "json"
require "net/http"
require "uri"

module Worker
  module Runtime
    class ClickhouseClient
      class Error < StandardError; end

      def initialize(config:)
        @config = config
      end

      def execute(statement)
        request(statement)
      end

      def insert_json_each_row(table, rows)
        return if rows.empty?

        request("INSERT INTO #{table} FORMAT JSONEachRow\n#{rows.map(&:to_json).join("\n")}")
      end

      private

      attr_reader :config

      def request(body)
        uri = URI.parse("#{config.clickhouse_http_url.delete_suffix("/")}/?database=#{URI.encode_www_form_component(config.clickhouse_db)}")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == "https"
        http.open_timeout = 2
        http.read_timeout = 10

        request = Net::HTTP::Post.new(uri.request_uri)
        request.basic_auth(config.clickhouse_user, config.clickhouse_password) if config.clickhouse_user.to_s != ""
        request.body = body

        response = http.request(request)
        raise Error, "clickhouse_status=#{response.code}" unless response.is_a?(Net::HTTPSuccess)

        response.body
      rescue SocketError, SystemCallError, Timeout::Error => e
        raise Error, e.message
      end
    end
  end
end
