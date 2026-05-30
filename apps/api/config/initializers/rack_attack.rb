# frozen_string_literal: true

module Rack
  class Attack
    # Rack::Attack configuration
    
    # Always allow requests from localhost
    safelist("allow from localhost") do |req|
      "127.0.0.1" == req.ip || "::1" == req.ip
    end

    # Global limit: 100 requests per minute per IP
    throttle("req/ip", limit: 100, period: 1.minute) do |req|
      req.ip
    end

    # Auth limit: 10 requests per minute per IP for authentication
    throttle("auth/ip", limit: 10, period: 1.minute) do |req|
      if req.path.start_with?("/api/v1/auth") && req.post?
        req.ip
      end
    end

    # Upload limit: 30 requests per minute per IP for creating uploads
    throttle("uploads/ip", limit: 30, period: 1.minute) do |req|
      if req.path.start_with?("/api/v1/uploads") && req.post?
        req.ip
      end
    end

    # Custom response for throttled requests
    self.throttled_response = lambda do |env|
      match_data = env["rack.attack.match_data"]
      now = match_data[:epoch_time]

      headers = {
        "Content-Type" => "application/json",
        "Retry-After" => (match_data[:period] - now % match_data[:period]).to_s
      }

      [
        429,
        headers,
        [ { error: { message: "Too many requests. Please try again later.", code: "rate_limit_exceeded" } }.to_json ]
      ]
    end
  end
end
