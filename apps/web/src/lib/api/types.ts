/* eslint-disable @typescript-eslint/no-unused-vars */


export type HealthResponse = {
  status: string
}

export type ListQuery = {
  status?: string
  page?: number
  per_page?: number
  search?: string
}

export type PaginationMeta = {
  page: number
  per_page: number
  total_count: number
  total_pages: number
}

export type OperationalQuery = {
  preset?: 'last_24h' | 'last_7d' | 'last_30d' | string
  from?: string
  to?: string
  timezone?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
  search?: string
}

export type AnalyticsKpis = {
  uploads_total: number
  jobs_total: number
  jobs_processing: number
  jobs_completed: number
  jobs_failed: number
  jobs_quarantined: number
  quarantine_records_total: number
  audit_events_total: number
}

export type AnalyticsBreakdowns = {
  status: { status: string; count: number }[]
  actor: { actor_id: string; count: number }[]
  source: { source: string; count: number }[]
}

export type AnalyticsSnapshot = {
  window: {
    from: string
    to: string
    preset?: string | null
    timezone: string
  }
  kpis: AnalyticsKpis
  breakdowns: AnalyticsBreakdowns
}

export type AnalyticsSectionStatus = 'live' | 'derived' | 'empty' | 'degraded' | string

export type AnalyticsDashboardSection<T> = {
  status: AnalyticsSectionStatus
  generated_at: string
  data: T
  empty_state: string | null
}

export type AnalyticsDashboardEvent = {
  id?: string | null
  timestamp: string | null
  type: string
  severity: 'info' | 'warning' | 'error' | string
  job_id: string | null
  upload_id: string | null
  status: string | null
  message: string
  metadata?: Record<string, unknown>
}

export type AnalyticsDashboardTimeseriesPoint = {
  label?: string
  bucket?: string
  timestamp?: string
  records?: number
  records_count?: number
  volume_gb?: number
  volume_bytes?: number
  jobs?: number
  jobs_total?: number
  failed?: number
  failed_jobs?: number
}

export type AnalyticsDashboardStatusDistributionItem = {
  status: string
  count: number
}

export type AnalyticsDashboardFormatItem = {
  content_type?: string
  format?: string
  label?: string
  count?: number
  jobs?: number
  volume_bytes?: number
  percent?: number
}

export type AnalyticsDashboardHeatmap = {
  rows?: { range: string; values: number[] }[]
  days?: string[]
}

export type AnalyticsDashboardJobBoardItem = Partial<JobSummary> & {
  file?: string
  filename?: string
  progress?: number
  duration_seconds?: number
}

export type AnalyticsDashboardQueueItem = {
  position?: number
  pos?: number | string
  name?: string
  filename?: string
  size?: string
  byte_size?: number
  eta?: string
  job_id?: string
}

export type AnalyticsDashboardIngestion = {
  supported_formats?: string[]
  enabled_formats?: string[]
  pending_formats?: string[]
  uploads?: Partial<UploadSummary>[]
}

export type AnalyticsDashboardWorkerLive = {
  id: string
  name?: string
  status: string
  active?: boolean
  current_job_id?: string | null
  current_label?: string | null
  progress?: number
  heartbeat_at?: string | null
}

export type AnalyticsDashboardAlert = {
  id: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | string
  href?: string
  created_at?: string | null
  reviewed_at?: string | null
  dismissed_at?: string | null
}

export type RealtimeTicketResponse = {
  ticket: string
  organization_id: string
  role: 'admin' | 'operator' | 'service_account' | string
  expires_at: string
}

export type RealtimeEvent = {
  id: string
  event_type: string
  organization_id: string
  actor_id?: string | null
  resource_type?: string | null
  resource_id?: string | null
  severity: 'info' | 'warning' | 'error' | string
  payload: Record<string, unknown>
  occurred_at: string
  expires_at: string
  trace_id: string
  request_id?: string | null
}

export type AnalyticsDashboardSnapshot = {
  generated_at: string
  source: 'postgres_derived' | 'clickhouse' | 'empty' | string
  window: AnalyticsSnapshot['window']
  sections: {
    queue: AnalyticsDashboardSection<{ processed: number; retried: number; moved_to_dlq: number }>
    workers: AnalyticsDashboardSection<{ processed: number; failed_terminal: number; average_latency_ms: number }>
    throughput: AnalyticsDashboardSection<{ jobs_total: number; uploads_total: number; completed: number; failed: number; quarantined: number }>
    formats: AnalyticsDashboardSection<AnalyticsDashboardFormatItem[]>
    warnings: AnalyticsDashboardSection<{ open: number; failed: number; resolved: number }>
    event_log: AnalyticsDashboardSection<AnalyticsDashboardEvent[]>
    timeseries_24h?: AnalyticsDashboardSection<AnalyticsDashboardTimeseriesPoint[]>
    status_distribution?: AnalyticsDashboardSection<AnalyticsDashboardStatusDistributionItem[]>
    heatmap_7d?: AnalyticsDashboardSection<AnalyticsDashboardHeatmap>
    jobs_board?: AnalyticsDashboardSection<AnalyticsDashboardJobBoardItem[]>
    queue_items?: AnalyticsDashboardSection<AnalyticsDashboardQueueItem[]>
    ingestion?: AnalyticsDashboardSection<AnalyticsDashboardIngestion>
    workers_live?: AnalyticsDashboardSection<AnalyticsDashboardWorkerLive[]>
    alerts?: AnalyticsDashboardSection<AnalyticsDashboardAlert[]>
  }
  dependencies: Record<string, { status: string; reason?: string; source?: string; fallback_reason?: string | null }>
  slo: {
    slo_target_seconds: number
    last_event_at: string | null
    lag_seconds: number | null
    stale: boolean
    p95_ms: number
    error_budget_percent: number
  }
}

export type AnalyticsWarehouseSnapshot = {
  source: 'clickhouse' | 'postgres_derived' | string
  generated_at: string
  last_event_at: string | null
  lag_seconds: number | null
  stale: boolean
  slo_target_seconds: number
  p95_ms: number
  error_budget_percent: number
  dependency_status: Record<string, string>
  fallback_reason: string | null
  aggregates: {
    jobs_total: number
    uploads_total: number
    records_total: number
    valid_records: number
    invalid_records: number
    by_status?: Record<string, number>
    by_source?: Record<string, number>
  }
}

export type QuarantineRecord = {
  id: string
  job_id: string
  job_batch_id: string | null
  severity: 'warning' | 'error' | string
  code: string
  message: string
  row_number: number | null
  payload?: Record<string, unknown>
  trace_id: string
  resolution_status?: 'open' | 'resolved' | string
  resolution_reason?: string | null
  resolved_by_id?: string | null
  resolved_at?: string | null
  created_at: string
  updated_at: string
}

export type DlqMessage = {
  payload: Record<string, unknown> | string
  exchange?: string
  routing_key: string
  redelivered?: boolean
  retry_count: number
  dead_letter_reason?: string | null
  headers: Record<string, unknown>
}

export type AuditEvent = {
  id: string
  action: string
  actor_id: string | null
  auditable_type: string
  auditable_id: string
  request_id: string
  trace_id: string
  occurred_at: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type QuarantineQuery = OperationalQuery & {
  severity?: string
  job_id?: string
  trace_id?: string
}

export type DlqQuery = OperationalQuery & {
  dead_letter_reason?: string
  event_name?: string
  trace_id?: string
  job_id?: string
}

export type AuditQuery = OperationalQuery & {
  action?: string
  actor_id?: string
  auditable_type?: string
  trace_id?: string
  request_id?: string
}

export type UploadContentType =
  | 'application/zip'
  | 'text/csv'
  | 'application/json'
  | 'application/x-ndjson'
  | 'application/ndjson'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/vnd.apache.parquet'

export type JobSummary = {
  id: string
  upload_id: string
  requested_by_id: string
  source_type: string
  status: string
  error_code: string | null
  error_category: string | null
  quarantined_records_count: number
  trace_id: string
  created_at: string | null
  updated_at: string | null
}

export type UploadAcquisition = {
  id: string
  upload_id: string
  job_id: string
  source_type: string
  link_mode: string
  status: string
  url_masked: string
  url_hash: string
  source_host: string
  content_type: string
  byte_size: number
  requested_at: string | null
  completed_at: string | null
  trace_id: string
  created_at: string
  updated_at: string
}

export type OperationActionInput = {
  reason: string
  idempotencyKey?: string
}

export type OperationActionResponse = {
  job_id?: string
  status: string
  attempt_id?: string
  outbox_id?: string
}

export type QuarantineResolveResponse = {
  id: string
  job_id: string
  resolution_status: string
  resolution_reason: string | null
  resolved_by_id: string | null
  resolved_at: string | null
}

export type DlqReplayRequest = {
  id: string
  message_id: string
  status: 'requested' | 'approved' | 'executing' | 'executed' | 'rejected' | 'failed' | string
  requested_by_id: string
  approved_by_id: string | null
  executed_by_id: string | null
  reason: string
  approval_reason: string | null
  execution_reason: string | null
  approved_at: string | null
  executed_at: string | null
  expires_at: string | null
  outbox_event_id: string | null
  trace_id: string
  created_at: string
  updated_at: string
}

export type JobArtifact = {
  id: string
  job_id: string
  artifact_type: 'processed_dataset' | 'quality_report' | 'audit_report' | string
  status: 'pending' | 'available' | 'failed' | 'expired' | string
  filename: string
  content_type: string
  byte_size: number
  checksum_sha256: string | null
  generated_at: string | null
  expires_at: string | null
  metadata?: Record<string, unknown>
  trace_id: string
  created_at: string
  updated_at: string
}

export type ArtifactDownloadUrlResponse = {
  artifact_id: string
  download_url: string
  expires_at: string
}

export type NotificationStatus = 'unread' | 'read' | 'archived'

export type NotificationItem = {
  id: string
  event_name: string
  title: string
  body: string
  status: NotificationStatus
  read_at: string | null
  expires_at: string | null
  metadata?: Record<string, unknown>
  trace_id: string
  created_at: string
}

export type NotificationSettings = {
  id: string
  user_id: string
  in_app_enabled: boolean
  email_enabled: boolean
  webhook_enabled: boolean
  webhook_url: string | null
  webhook_secret: null
  created_at?: string
  updated_at?: string
}

export type NotificationSettingsInput = {
  inAppEnabled: boolean
  emailEnabled: boolean
  webhookEnabled: boolean
  webhookUrl?: string | null
}

export type NotificationBulkResponse = {
  updated_count?: number
  archived_count?: number
  ids?: string[]
}

export type WebhookDeliveryResponse = {
  id: string
  notification_id: string | null
  channel: 'email' | 'webhook' | string
  event_name: string
  status: 'pending' | 'delivered' | 'failed' | string
  attempts_count: number
  next_attempt_at: string | null
  delivered_at: string | null
  response_status: number | null
  trace_id: string
  created_at: string
  webhook_secret: null
}

export type UploadSummary = {
  id: string
  filename: string
  content_type: string
  byte_size: number
  checksum_sha256: string
  storage_key: string
  source_type?: string
  status: string
  sensitivity_level: string
  user_id: string
  trace_id: string
  created_at: string | null
  updated_at: string | null
}

export type UploadSignedUrlRequest = {
  filename: string
  contentType: UploadContentType
  byteSize: number
  checksumSha256: string
}

export type UploadSignedUrlResponse = {
  storage_key: string
  method: 'PUT'
  upload_url: string
  expires_at: string
  required_headers: Record<string, string>
}

export type UploadRegisterRequest = {
  filename: string
  contentType: UploadContentType
  byteSize: number
  checksumSha256: string
  storageKey: string
  metadata?: Record<string, unknown>
}

export type UploadRegisterResponse = {
  upload: UploadSummary
  job: JobSummary
}

export type PublicLinkUploadRequest = {
  url: string
  filename: string
  contentType: UploadContentType
  byteSize: number
  idempotencyKey?: string
}

export type PublicLinkUploadResponse = UploadRegisterResponse & {
  acquisition: UploadAcquisition | null
}

export type DashboardExportKind = 'snapshot' | 'series' | 'heatmap' | 'event_log'
export type DashboardExportFormat = 'csv' | 'json'

export type DashboardExportRequest = {
  kind: DashboardExportKind
  format: DashboardExportFormat
  preset?: string
  from?: string
  to?: string
  timezone?: string
  idempotencyKey?: string
}

export type DashboardExportResponse = {
  id: string
  organization_id?: string
  actor_id?: string
  kind: DashboardExportKind | string
  format: DashboardExportFormat | string
  filename: string
  content_type: string
  byte_size?: number
  checksum_sha256?: string
  metadata?: Record<string, unknown>
  generated_at?: string | null
  expires_at?: string | null
  trace_id?: string
  content: string
}

export type AlertActionResponse = {
  id: string
  status: string
  reviewed_at?: string | null
  dismissed_at?: string | null
  [key: string]: unknown
}

export type ConnectorKind = 's3' | 'http' | 'google_drive' | 'oauth_delegated'
export type ConnectorStatus = 'active' | 'disabled'

export type ConnectorProfile = {
  id: string
  organization_id?: string
  kind: ConnectorKind
  name: string
  status: ConnectorStatus | string
  settings: Record<string, unknown>
  created_by_id?: string
  trace_id?: string
  created_at?: string | null
  updated_at?: string | null
}

export type ConnectorProfileInput = {
  name?: string
  kind?: ConnectorKind
  status?: ConnectorStatus
  settings?: Record<string, unknown>
  secrets?: Record<string, unknown>
  idempotencyKey?: string
}

export type ConnectorProfileTestResponse = {
  id: string
  status: string
  kind: ConnectorKind
}

export type ConnectorIngestion = {
  id: string
  connector_profile_id: string
  upload_id: string
  job_id: string
  requested_by_id?: string
  status: string
  object_key?: string | null
  source_path?: string | null
  drive_file_id?: string | null
  drive_folder_id?: string | null
  parent_ingestion_id?: string | null
  filename: string
  content_type: string
  byte_size?: number | null
  trace_id: string
  created_at?: string | null
  updated_at?: string | null
}

export type ConnectorIngestionRequest = {
  filename: string
  contentType: UploadContentType
  objectKey?: string
  sourcePath?: string
  driveFileId?: string
  driveFolderId?: string
  byteSize?: number
  idempotencyKey?: string
}

export type ConnectorIngestionResponse = UploadRegisterResponse & {
  ingestion: ConnectorIngestion
  lease: {
    id: string
    expires_at?: string | null
  }
}

export type Organization = {
  id: string
  slug?: string
  name: string
  status: string
  quotas: Record<string, number>
  retention_days: number
  compliance_profile: Record<string, unknown>
  created_at?: string | null
  updated_at?: string | null
}

export type OrganizationMembership = {
  id: string
  organization_id: string
  user_id: string
  email?: string | null
  full_name?: string | null
  role: 'admin' | 'operator' | string
  status: 'active' | 'invited' | 'suspended' | string
  joined_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type OrganizationInvite = {
  id: string
  organization_id: string
  email: string
  role: 'admin' | 'operator' | string
  status: string
  expires_at?: string | null
  invited_by_id?: string | null
  accepted_by_id?: string | null
  accepted_at?: string | null
  created_at?: string | null
  updated_at?: string | null
  debug_invite_token?: string
}

export type OrganizationPayload = {
  organization: Organization
  members: OrganizationMembership[]
  invites: OrganizationInvite[]
}

export type OrganizationUpdateInput = {
  name?: string
  retentionDays?: number
  quotas?: Record<string, number>
  settings?: Record<string, unknown>
  complianceProfile?: Record<string, unknown>
  idempotencyKey?: string
}

export type OrganizationInviteInput = {
  email: string
  role: 'admin' | 'operator'
  idempotencyKey?: string
}

export type OrganizationMemberInput = {
  role?: 'admin' | 'operator'
  status?: 'active' | 'suspended'
  idempotencyKey?: string
}

export type MfaSetupResponse = {
  factor_id: string
  secret: string
  provisioning_uri: string
  status: string
}

export type MfaVerifyInput = {
  code: string
  challengeToken?: string
}

export type MfaVerifyResponse = AuthPayload | {
  factor_id: string
  status: string
  recovery_codes: string[]
}

export type OidcProvider = {
  id: string
  organization_id: string
  provider: 'google_workspace' | string
  issuer: string
  client_id: string
  hosted_domain: string
  scopes: string[]
  status: string
  created_at?: string | null
  updated_at?: string | null
}

export type GoogleOidcProviderInput = {
  issuer: string
  clientId: string
  clientSecret: string
  hostedDomain: string
}

export type OidcStartResponse = {
  authorization_url: string
  state: string
  nonce: string
  expires_at: string
}

export type GoogleDriveAuthorizeResponse = {
  authorization_url: string
  state: string
  expires_at: string
  scopes: string[]
}

export type GoogleDriveConnection = {
  id: string
  organization_id: string
  user_id: string
  provider: 'google_drive' | string
  status: string
  scopes: string[]
  token_expires_at?: string | null
  revoked_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type GoogleDriveItem = {
  id: string
  name: string
  mime_type: string
  kind: 'file' | 'folder' | string
}

export type SaasReadiness = {
  generated_at: string
  organization: {
    id: string
    members: {
      active: number
      invited: number
      suspended: number
    }
  }
  access: {
    role: string
    admin: boolean
  }
  identity: {
    mfa: {
      mode: string
      status: string
      recovery_codes: string
    }
    sso: {
      protocol: string
      validated_provider: string
      status: string
    }
    saml: {
      enabled: boolean
      status: string
    }
  }
  billing: {
    status: string
    reason: string
  }
  quotas: {
    status: string
    defaults: Record<string, number>
  }
  connectors: {
    configured_count: number
    active_profiles: number
    supported: string[]
    google_drive: {
      status: string
      acquisition_modes: string[]
    }
    oauth_delegated: {
      status: string
      provider: string
    }
    clear_lease_credentials_circulate: boolean
  }
  security: {
    controls: string[]
    sensitive_surface: Record<string, boolean>
  }
  infrastructure: {
    runtime: string
    ingress_tls: boolean
    credential_store: string
    data_services: string[]
  }
  observability: {
    stack: string
    telemetry: string
    metrics: string
    logs: string
    dashboards: string
    alerts: string
  }
  compliance: {
    target: string
    status: string
    evidence_sections: string[]
  }
  external_blockers: string[]
}

export type AnalyticsLineage = {
  job: JobSummary
  upload: UploadSummary
  acquisition: UploadAcquisition | null
  batches: {
    id: string
    job_id: string
    batch_number: number
    status: string
    input_rows: number
    valid_rows: number
    invalid_rows: number
    trace_id: string
    created_at: string | null
    updated_at: string | null
  }[]
  attempts: {
    id: string
    attempt_number: number
    operation: string
    status: string
    retryable: boolean
    error_code: string | null
    started_at: string | null
    finished_at: string | null
    trace_id: string
  }[]
  quarantine: {
    id: string
    job_batch_id: string | null
    row_number: number | null
    code: string
    message: string
    severity: string
    resolution_status: string
    trace_id: string
    created_at: string | null
  }[]
  artifacts: JobArtifact[]
  warnings: {
    id: string
    code: string
    message: string
    status: string
    severity: string
    trace_id: string
    created_at: string
    updated_at: string
  }[]
  audit_refs: {
    id: string
    action: string
    auditable_type: string
    auditable_id: string
    trace_id: string
    occurred_at: string | null
  }[]
}

export type AuthUser = {
  id: string
  email: string
  full_name: string
  role: 'operator' | 'admin' | 'service_account'
  status: 'invited' | 'active' | 'suspended'
  created_at?: string
  updated_at?: string
}

export type AuthToken = {
  id: string
  token_type: 'Bearer' | string
  access_token: string
  expires_at: string
}

export type AuthSession = {
  id: string
  user_id: string
  expires_at: string
  revoked_at: string | null
  last_seen_at: string | null
  trace_id: string
  created_at?: string
  updated_at?: string
}

export type AuthPayload = {
  user: AuthUser
  session: AuthToken
}

export type SessionRefreshPayload = {
  session: AuthToken
}

export type PasswordResetRequestPayload = {
  message: string
  debug_reset_token?: string
}

export type MessagePayload = {
  message?: string
  revoked?: boolean
}

export type RegisterInput = {
  fullName: string
  email: string
  password: string
  passwordConfirmation: string
}

export type LoginInput = {
  email: string
  password: string
}

export type PasswordResetConfirmInput = {
  token: string
  password: string
  passwordConfirmation: string
}

