#!/usr/bin/env ruby
# frozen_string_literal: true

require "net/http"
require "json"
require "uri"

BASE_URL = ENV.fetch("STREAMGATE_API_BASE_URL", "http://localhost:3000")
TOKEN = ENV.fetch("STREAMGATE_API_TOKEN", "")
REQUESTS_PER_ENDPOINT = ENV.fetch("STREAMGATE_PERF_REQUESTS", "20").to_i
P95_BUDGET_MS = ENV.fetch("OPERATIONAL_READS_SLO_P95_MS", "500").to_i

ENDPOINTS = [
  "/api/v1/analytics?preset=last_7d",
  "/api/v1/quarantine?preset=last_7d",
  "/api/v1/audit?preset=last_7d"
].freeze

abort("STREAMGATE_API_TOKEN is required") if TOKEN.strip.empty?

def measure_request(path)
  uri = URI.join(BASE_URL, path)
  request = Net::HTTP::Get.new(uri)
  request["Authorization"] = "Bearer #{TOKEN}"

  started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
  response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https") { |http| http.request(request) }
  elapsed_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started) * 1000).round(2)
  [ elapsed_ms, response.code.to_i ]
end

def percentile(values, p)
  return 0 if values.empty?

  sorted = values.sort
  rank = (p * (sorted.size - 1)).ceil
  sorted[rank]
end

failures = []

ENDPOINTS.each do |path|
  latencies = []
  status_codes = []

  REQUESTS_PER_ENDPOINT.times do
    latency, status = measure_request(path)
    latencies << latency
    status_codes << status
  end

  p95 = percentile(latencies, 0.95)
  error_rate = status_codes.count { |status| status >= 400 }.to_f / status_codes.size.to_f * 100

  puts "#{path} -> p95=#{p95}ms error_rate=#{error_rate.round(2)}%"

  failures << "#{path} p95 #{p95}ms > budget #{P95_BUDGET_MS}ms" if p95 > P95_BUDGET_MS
  failures << "#{path} error rate #{error_rate.round(2)}% > 1%" if error_rate > 1.0
end

if failures.any?
  warn "Operational read SLO failed:"
  failures.each { |failure| warn "- #{failure}" }
  exit(1)
end

puts "Operational read SLO check passed."
