#!/usr/bin/env ruby
# frozen_string_literal: true

require "yaml"
require "json"

ROOT = File.expand_path("../..", __dir__)
OPENAPI_PATH = File.join(ROOT, "apps/api/openapi/v1/openapi.yaml")

HTTP_CONTRACTS = [
  "packages/contracts/schemas/http/operational-reads/analytics-response.v1.json",
  "packages/contracts/schemas/http/operational-reads/analytics-dashboard-response.v1.json",
  "packages/contracts/schemas/http/operational-reads/analytics-warehouse-response.v1.json",
  "packages/contracts/schemas/http/operational-reads/analytics-lineage-response.v1.json",
  "packages/contracts/schemas/http/operational-reads/quarantine-list-response.v1.json",
  "packages/contracts/schemas/http/operational-reads/audit-list-response.v1.json",
  "packages/contracts/schemas/http/operational-reads/dlq-list-response.v1.json",
  "packages/contracts/schemas/http/uploads/public-link-request.v1.json",
  "packages/contracts/schemas/http/uploads/public-link-response.v1.json"
].freeze

HTTP_EXAMPLES = [
  "packages/contracts/examples/http/operational-reads/analytics-list.v1.json",
  "packages/contracts/examples/http/operational-reads/analytics-dashboard.v1.json",
  "packages/contracts/examples/http/operational-reads/analytics-warehouse.v1.json",
  "packages/contracts/examples/http/operational-reads/analytics-lineage.v1.json",
  "packages/contracts/examples/http/operational-reads/quarantine-list.v1.json",
  "packages/contracts/examples/http/operational-reads/audit-list.v1.json",
  "packages/contracts/examples/http/operational-reads/dlq-list.v1.json",
  "packages/contracts/examples/http/uploads/public-link-created.v1.json"
].freeze

EVENT_SCHEMA_PATH = "packages/contracts/schemas/events/uploads/upload.received.v1.json"
EVENT_EXAMPLE_PATH = "packages/contracts/examples/events/uploads/upload.received.v1.json"
PUBLIC_LINK_EVENT_SCHEMA_PATH = "packages/contracts/schemas/events/uploads/upload.public_link.requested.v1.json"
PUBLIC_LINK_EVENT_EXAMPLE_PATH = "packages/contracts/examples/events/uploads/upload.public_link.requested.v1.json"

REQUIRED_PATHS = {
  "/api/v1/analytics" => "#/components/schemas/AnalyticsEnvelope",
  "/api/v1/analytics/dashboard" => "#/components/schemas/AnalyticsDashboardEnvelope",
  "/api/v1/analytics/warehouse" => "#/components/schemas/AnalyticsWarehouseEnvelope",
  "/api/v1/analytics/lineage" => "#/components/schemas/AnalyticsLineageEnvelope",
  "/api/v1/quarantine" => "#/components/schemas/QuarantineListEnvelope",
  "/api/v1/audit" => "#/components/schemas/AuditListEnvelope",
  "/api/v1/quarantine/dlq" => "#/components/schemas/DlqListEnvelope"
}.freeze

def assert!(condition, message)
  return if condition

  warn "ERROR: #{message}"
  exit(1)
end

def parse_json!(path)
  JSON.parse(File.read(path))
rescue JSON::ParserError => error
  warn "ERROR: invalid JSON at #{path}: #{error.message}"
  exit(1)
end

openapi = YAML.safe_load(File.read(OPENAPI_PATH))
paths = openapi.fetch("paths", {})

REQUIRED_PATHS.each do |path, schema_ref|
  operation = paths.fetch(path, {})["get"]
  assert!(!operation.nil?, "missing GET operation at #{path}")
  actual_ref = operation.dig("responses", "200", "content", "application/json", "schema", "$ref")
  assert!(actual_ref == schema_ref, "unexpected 200 schema ref for #{path}: #{actual_ref.inspect} (expected #{schema_ref})")
end

HTTP_CONTRACTS.each do |relative_path|
  full_path = File.join(ROOT, relative_path)
  assert!(File.exist?(full_path), "missing contract schema #{relative_path}")
  parse_json!(full_path)
end

HTTP_EXAMPLES.each do |relative_path|
  full_path = File.join(ROOT, relative_path)
  assert!(File.exist?(full_path), "missing contract example #{relative_path}")
  parse_json!(full_path)
end

event_schema = parse_json!(File.join(ROOT, EVENT_SCHEMA_PATH))
event_example = parse_json!(File.join(ROOT, EVENT_EXAMPLE_PATH))

assert!(event_schema.dig("properties", "event_name", "const") == "upload.received.v1", "event schema const must be upload.received.v1")
assert!(event_example["event_name"] == "upload.received.v1", "event example must use upload.received.v1")
assert!(event_schema["required"].include?("correlation_id"), "event schema must require correlation_id")
assert!(event_example.key?("correlation_id"), "event example must include correlation_id")

public_link_event_schema = parse_json!(File.join(ROOT, PUBLIC_LINK_EVENT_SCHEMA_PATH))
public_link_event_example = parse_json!(File.join(ROOT, PUBLIC_LINK_EVENT_EXAMPLE_PATH))

assert!(public_link_event_schema.dig("properties", "event_name", "const") == "upload.public_link.requested.v1", "public link event schema const must be upload.public_link.requested.v1")
assert!(public_link_event_example["event_name"] == "upload.public_link.requested.v1", "public link event example must use upload.public_link.requested.v1")
assert!(public_link_event_example.dig("payload", "url_masked").to_s !~ /[?&]/, "public link event example url_masked must not expose query string")

dashboard_schema = parse_json!(File.join(ROOT, "packages/contracts/schemas/http/operational-reads/analytics-dashboard-response.v1.json"))
dashboard_example = parse_json!(File.join(ROOT, "packages/contracts/examples/http/operational-reads/analytics-dashboard.v1.json"))
warehouse_schema = parse_json!(File.join(ROOT, "packages/contracts/schemas/http/operational-reads/analytics-warehouse-response.v1.json"))
warehouse_example = parse_json!(File.join(ROOT, "packages/contracts/examples/http/operational-reads/analytics-warehouse.v1.json"))

assert!(dashboard_schema.dig("properties", "data", "properties", "sections", "required").include?("event_log"), "dashboard schema must require sections.event_log")
assert!(dashboard_example.dig("data", "sections", "event_log", "data").is_a?(Array), "dashboard example must include event_log array")
%w[records_total valid_records invalid_records].each do |field|
  assert!(warehouse_schema.dig("properties", "data", "properties", "aggregates", "required").include?(field), "warehouse schema must require aggregates.#{field}")
  assert!(warehouse_example.dig("data", "aggregates").key?(field), "warehouse example must include aggregates.#{field}")
end

puts "Operational contract validation passed."
