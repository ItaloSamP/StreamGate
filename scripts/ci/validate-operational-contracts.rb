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
  "packages/contracts/schemas/http/operational-reads/realtime-events-response.v1.json",
  "packages/contracts/schemas/http/operational-reads/quarantine-list-response.v1.json",
  "packages/contracts/schemas/http/operational-reads/audit-list-response.v1.json",
  "packages/contracts/schemas/http/operational-reads/dlq-list-response.v1.json",
  "packages/contracts/schemas/http/operations/dashboard-export-response.v1.json",
  "packages/contracts/schemas/http/operations/alert-action-response.v1.json",
  "packages/contracts/schemas/http/connectors/connector-profile-response.v1.json",
  "packages/contracts/schemas/http/connectors/connector-ingestion-response.v1.json",
  "packages/contracts/schemas/http/connectors/google-drive-authorize-response.v1.json",
  "packages/contracts/schemas/http/connectors/google-drive-items-response.v1.json",
  "packages/contracts/schemas/http/identity/mfa-setup-response.v1.json",
  "packages/contracts/schemas/http/identity/oidc-provider-response.v1.json",
  "packages/contracts/schemas/http/saas/organization-response.v1.json",
  "packages/contracts/schemas/http/saas/saas-readiness-response.v1.json",
  "packages/contracts/schemas/http/uploads/public-link-request.v1.json",
  "packages/contracts/schemas/http/uploads/public-link-response.v1.json"
].freeze

HTTP_EXAMPLES = [
  "packages/contracts/examples/http/operational-reads/analytics-list.v1.json",
  "packages/contracts/examples/http/operational-reads/analytics-dashboard.v1.json",
  "packages/contracts/examples/http/operational-reads/analytics-warehouse.v1.json",
  "packages/contracts/examples/http/operational-reads/analytics-lineage.v1.json",
  "packages/contracts/examples/http/operational-reads/realtime-events.v1.json",
  "packages/contracts/examples/http/operational-reads/quarantine-list.v1.json",
  "packages/contracts/examples/http/operational-reads/audit-list.v1.json",
  "packages/contracts/examples/http/operational-reads/dlq-list.v1.json",
  "packages/contracts/examples/http/operations/dashboard-export-created.v1.json",
  "packages/contracts/examples/http/operations/alert-reviewed.v1.json",
  "packages/contracts/examples/http/connectors/connector-profile-created.v1.json",
  "packages/contracts/examples/http/connectors/connector-ingestion-created.v1.json",
  "packages/contracts/examples/http/connectors/google-drive-authorize.v1.json",
  "packages/contracts/examples/http/connectors/google-drive-items.v1.json",
  "packages/contracts/examples/http/identity/mfa-setup.v1.json",
  "packages/contracts/examples/http/identity/oidc-provider.v1.json",
  "packages/contracts/examples/http/saas/organization.v1.json",
  "packages/contracts/examples/http/saas/saas-readiness.v1.json",
  "packages/contracts/examples/http/uploads/public-link-created.v1.json"
].freeze

EVENT_SCHEMA_PATH = "packages/contracts/schemas/events/uploads/upload.received.v1.json"
EVENT_EXAMPLE_PATH = "packages/contracts/examples/events/uploads/upload.received.v1.json"
UPLOAD_SCAN_EVENT_SCHEMA_PATH = "packages/contracts/schemas/events/uploads/upload.scan.requested.v1.json"
UPLOAD_SCAN_EVENT_EXAMPLE_PATH = "packages/contracts/examples/events/uploads/upload.scan.requested.v1.json"
PUBLIC_LINK_EVENT_SCHEMA_PATH = "packages/contracts/schemas/events/uploads/upload.public_link.requested.v1.json"
PUBLIC_LINK_EVENT_EXAMPLE_PATH = "packages/contracts/examples/events/uploads/upload.public_link.requested.v1.json"
CONNECTOR_EVENT_SCHEMA_PATH = "packages/contracts/schemas/events/connectors/connector.ingestion.requested.v1.json"
CONNECTOR_EVENT_EXAMPLE_PATH = "packages/contracts/examples/events/connectors/connector.ingestion.requested.v1.json"

REQUIRED_PATHS = {
  "/api/v1/analytics" => "#/components/schemas/AnalyticsEnvelope",
  "/api/v1/analytics/dashboard" => "#/components/schemas/AnalyticsDashboardEnvelope",
  "/api/v1/realtime/events" => "#/components/schemas/RealtimeEventListEnvelope",
  "/api/v1/analytics/warehouse" => "#/components/schemas/AnalyticsWarehouseEnvelope",
  "/api/v1/analytics/lineage" => "#/components/schemas/AnalyticsLineageEnvelope",
  "/api/v1/quarantine" => "#/components/schemas/QuarantineListEnvelope",
  "/api/v1/audit" => "#/components/schemas/AuditListEnvelope",
  "/api/v1/quarantine/dlq" => "#/components/schemas/DlqListEnvelope",
  "/api/v1/saas/readiness" => "#/components/schemas/SaasReadinessEnvelope",
  "/api/v1/organization" => "#/components/schemas/OrganizationEnvelope",
  "/api/v1/organization/members" => "#/components/schemas/OrganizationMemberListEnvelope",
  "/api/v1/connectors/google-drive/items" => "#/components/schemas/GoogleDriveItemListEnvelope"
}.freeze

RELEASE_INFRA_PATHS = {
  "infra/helm/streamgate/Chart.yaml" => "Helm chart metadata",
  "infra/helm/streamgate/values.yaml" => "Helm values for AWS EKS release profile",
  "infra/helm/streamgate/templates/deployment-api.yaml" => "API deployment",
  "infra/helm/streamgate/templates/deployment-web.yaml" => "web deployment",
  "infra/helm/streamgate/templates/deployment-worker.yaml" => "worker deployment",
  "infra/helm/streamgate/templates/deployment-clamav.yaml" => "ClamAV deployment",
  "infra/helm/streamgate/templates/service-clamav.yaml" => "ClamAV service",
  "infra/helm/streamgate/templates/externalsecret.yaml" => "External Secrets integration",
  "infra/helm/streamgate/templates/networkpolicy.yaml" => "NetworkPolicy egress/ingress policy",
  "infra/helm/streamgate/templates/prometheusrule.yaml" => "Prometheus alert rules",
  "infra/gitops/argocd/streamgate-application.yaml" => "ArgoCD application",
  "docs/guides/security/soc2-type-i-control-matrix.md" => "SOC 2 Type I control matrix",
  "docs/guides/security/release-threat-model.md" => "release threat model"
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

upload_scan_event_schema = parse_json!(File.join(ROOT, UPLOAD_SCAN_EVENT_SCHEMA_PATH))
upload_scan_event_example = parse_json!(File.join(ROOT, UPLOAD_SCAN_EVENT_EXAMPLE_PATH))

assert!(upload_scan_event_schema.dig("properties", "event_name", "const") == "upload.scan.requested.v1", "upload scan event schema const must be upload.scan.requested.v1")
assert!(upload_scan_event_example["event_name"] == "upload.scan.requested.v1", "upload scan event example must use upload.scan.requested.v1")
assert!(upload_scan_event_example.dig("payload", "storage_key").to_s !~ %r{https?://}i, "upload scan event example must not expose signed or public URLs")

assert!(public_link_event_schema.dig("properties", "event_name", "const") == "upload.public_link.requested.v1", "public link event schema const must be upload.public_link.requested.v1")
assert!(public_link_event_example["event_name"] == "upload.public_link.requested.v1", "public link event example must use upload.public_link.requested.v1")
assert!(public_link_event_example.dig("payload", "url_masked").to_s !~ /[?&]/, "public link event example url_masked must not expose query string")

connector_event_schema = parse_json!(File.join(ROOT, CONNECTOR_EVENT_SCHEMA_PATH))
connector_event_example = parse_json!(File.join(ROOT, CONNECTOR_EVENT_EXAMPLE_PATH))
connector_ingestion_schema = parse_json!(File.join(ROOT, "packages/contracts/schemas/http/connectors/connector-ingestion-response.v1.json"))
connector_ingestion_example = parse_json!(File.join(ROOT, "packages/contracts/examples/http/connectors/connector-ingestion-created.v1.json"))
saas_readiness_schema = parse_json!(File.join(ROOT, "packages/contracts/schemas/http/saas/saas-readiness-response.v1.json"))
saas_readiness_example = parse_json!(File.join(ROOT, "packages/contracts/examples/http/saas/saas-readiness.v1.json"))

assert!(connector_event_schema.dig("properties", "event_name", "const") == "connector.ingestion.requested.v1", "connector event schema const must be connector.ingestion.requested.v1")
assert!(connector_event_example["event_name"] == "connector.ingestion.requested.v1", "connector event example must use connector.ingestion.requested.v1")
assert!(connector_event_schema.dig("properties", "payload", "required") == [ "lease_id" ], "connector event payload must require only lease_id")
assert!(!connector_event_schema.dig("properties", "payload", "properties").key?("lease_token"), "connector event schema must not expose lease_token")
assert!(!connector_event_example.dig("payload").key?("lease_token"), "connector event example must not expose lease_token")
assert!(connector_ingestion_schema.dig("properties", "data", "properties", "lease", "required") == [ "id", "expires_at" ], "connector ingestion response lease must require only id and expires_at")
assert!(!connector_ingestion_schema.dig("properties", "data", "properties", "lease", "properties").key?("token"), "connector ingestion response schema must not expose lease token")
assert!(!connector_ingestion_example.dig("data", "lease").key?("token"), "connector ingestion response example must not expose lease token")
assert!(saas_readiness_schema.dig("properties", "data", "properties", "access", "properties", "role", "enum") == [ "admin" ], "SaaS readiness must be admin-only in schema")
assert!(saas_readiness_example.dig("data", "connectors", "supported").include?("google_drive"), "SaaS readiness example must include Google Drive connector")
assert!(saas_readiness_example.dig("data", "connectors", "clear_lease_credentials_circulate") == false, "SaaS readiness must assert clear lease credentials do not circulate")
assert!(saas_readiness_example.dig("data", "billing", "status") == "out_of_scope", "SaaS readiness must keep billing out of scope")
assert!(JSON.generate(saas_readiness_example) !~ /refresh_token|client_secret|lease_token|x-worker-token|Bearer\s+[A-Za-z0-9._-]+/i, "SaaS readiness example must not expose sensitive credentials")

(HTTP_CONTRACTS + HTTP_EXAMPLES + [ UPLOAD_SCAN_EVENT_SCHEMA_PATH, UPLOAD_SCAN_EVENT_EXAMPLE_PATH, PUBLIC_LINK_EVENT_EXAMPLE_PATH, CONNECTOR_EVENT_EXAMPLE_PATH ]).each do |relative_path|
  contents = File.read(File.join(ROOT, relative_path))
  assert!(contents !~ /refresh_token|client_secret|lease_token|x-worker-token|Bearer\s+[A-Za-z0-9._-]+/i, "#{relative_path} must not expose sensitive credential markers")
end

dashboard_schema = parse_json!(File.join(ROOT, "packages/contracts/schemas/http/operational-reads/analytics-dashboard-response.v1.json"))
dashboard_example = parse_json!(File.join(ROOT, "packages/contracts/examples/http/operational-reads/analytics-dashboard.v1.json"))
warehouse_schema = parse_json!(File.join(ROOT, "packages/contracts/schemas/http/operational-reads/analytics-warehouse-response.v1.json"))
warehouse_example = parse_json!(File.join(ROOT, "packages/contracts/examples/http/operational-reads/analytics-warehouse.v1.json"))

assert!(dashboard_schema.dig("properties", "data", "properties", "sections", "required").include?("event_log"), "dashboard schema must require sections.event_log")
assert!(dashboard_schema.dig("properties", "data", "properties", "sections", "required").include?("timeseries_24h"), "dashboard schema must require sections.timeseries_24h")
assert!(dashboard_example.dig("data", "sections", "event_log", "data").is_a?(Array), "dashboard example must include event_log array")
assert!(dashboard_example.dig("data", "sections", "ingestion", "data", "enabled_formats").include?("Parquet"), "dashboard example must include Parquet enabled format")
%w[records_total valid_records invalid_records].each do |field|
  assert!(warehouse_schema.dig("properties", "data", "properties", "aggregates", "required").include?(field), "warehouse schema must require aggregates.#{field}")
  assert!(warehouse_example.dig("data", "aggregates").key?(field), "warehouse example must include aggregates.#{field}")
end

RELEASE_INFRA_PATHS.each do |relative_path, description|
  assert!(File.exist?(File.join(ROOT, relative_path)), "missing #{description} at #{relative_path}")
end

puts "Operational contract validation passed."
