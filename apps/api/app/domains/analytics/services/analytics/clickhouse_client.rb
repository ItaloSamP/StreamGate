require "json"
require "net/http"
require "uri"

module Analytics
  class ClickhouseClient
    class Error < StandardError; end

    DEFAULT_ENDPOINT = "http://localhost:8123"

    def initialize(
      endpoint: ENV.fetch("CLICKHOUSE_HTTP_URL", DEFAULT_ENDPOINT),
      database: ENV.fetch("CLICKHOUSE_DB", "streamgate"),
      username: ENV.fetch("CLICKHOUSE_USER", "default"),
      password: ENV.fetch("CLICKHOUSE_PASSWORD", "")
    )
      @endpoint = endpoint.to_s.delete_suffix("/")
      @database = database
      @username = username
      @password = password
    end

    def ping
      response = request("SELECT 1 FORMAT JSON")
      response.fetch("data").any?
    end

    def query(sql)
      request("#{sql} FORMAT JSON")
    end

    private

    attr_reader :endpoint, :database, :username, :password

    def request(sql)
      uri = URI.parse("#{endpoint}/?database=#{URI.encode_www_form_component(database)}")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"
      http.open_timeout = 2
      http.read_timeout = 5

      request = Net::HTTP::Post.new(uri.request_uri)
      request.basic_auth(username, password) if username.present?
      request.body = sql

      response = http.request(request)
      raise Error, "clickhouse_status=#{response.code}" unless response.is_a?(Net::HTTPSuccess)

      JSON.parse(response.body)
    rescue JSON::ParserError, SocketError, SystemCallError, Timeout::Error, Net::OpenTimeout, Net::ReadTimeout => e
      raise Error, e.message
    end
  end
end
