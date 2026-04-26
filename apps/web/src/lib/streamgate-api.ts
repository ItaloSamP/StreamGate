import { apiClient, type ApiSuccessEnvelope, type RequestOptions } from '@/lib/api-client'

type StreamgateHttpClient = {
  get: <T>(path: string, options?: RequestOptions) => Promise<T>
  post: <T>(path: string, options?: RequestOptions) => Promise<T>
  patch?: <T>(path: string, options?: RequestOptions) => Promise<T>
  delete?: <T>(path: string, options?: RequestOptions) => Promise<T>
  getEnvelope?: <T>(path: string, options?: RequestOptions) => Promise<ApiSuccessEnvelope<T>>
  postEnvelope?: <T>(path: string, options?: RequestOptions) => Promise<ApiSuccessEnvelope<T>>
  patchEnvelope?: <T>(path: string, options?: RequestOptions) => Promise<ApiSuccessEnvelope<T>>
  deleteEnvelope?: <T>(path: string, options?: RequestOptions) => Promise<ApiSuccessEnvelope<T>>
}

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
  timestamp: string | null
  type: string
  severity: 'info' | 'warning' | 'error' | string
  job_id: string | null
  upload_id: string | null
  status: string | null
  message: string
}

export type AnalyticsDashboardSnapshot = {
  generated_at: string
  source: 'postgres_derived' | 'clickhouse' | 'empty' | string
  window: AnalyticsSnapshot['window']
  sections: {
    queue: AnalyticsDashboardSection<{ processed: number; retried: number; moved_to_dlq: number }>
    workers: AnalyticsDashboardSection<{ processed: number; failed_terminal: number; average_latency_ms: number }>
    throughput: AnalyticsDashboardSection<{ jobs_total: number; uploads_total: number; completed: number; failed: number; quarantined: number }>
    formats: AnalyticsDashboardSection<{ content_type: string; count: number }[]>
    warnings: AnalyticsDashboardSection<{ open: number; failed: number; resolved: number }>
    event_log: AnalyticsDashboardSection<AnalyticsDashboardEvent[]>
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

export type UploadContentType = 'application/zip' | 'text/csv'

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

function normalizeListQuery(query?: ListQuery): Record<string, string | number | boolean | null | undefined> | undefined {
  if (!query) return undefined

  return {
    status: query.status,
    page: query.page,
    per_page: query.per_page,
    search: query.search,
  }
}

function normalizeOperationalQuery(query?: OperationalQuery): Record<string, string | number | boolean | null | undefined> | undefined {
  if (!query) return undefined

  return {
    preset: query.preset,
    from: query.from,
    to: query.to,
    timezone: query.timezone,
    sort_by: query.sort_by,
    sort_order: query.sort_order,
    page: query.page,
    per_page: query.per_page,
    search: query.search,
  }
}

function normalizeQuarantineQuery(query?: QuarantineQuery) {
  if (!query) return undefined

  return {
    ...normalizeOperationalQuery(query),
    severity: query.severity,
    job_id: query.job_id,
    trace_id: query.trace_id,
  }
}

function normalizeDlqQuery(query?: DlqQuery) {
  if (!query) return undefined

  return {
    dead_letter_reason: query.dead_letter_reason,
    event_name: query.event_name,
    trace_id: query.trace_id,
    job_id: query.job_id,
    sort_by: query.sort_by,
    sort_order: query.sort_order,
    page: query.page,
    per_page: query.per_page,
    search: query.search,
  }
}

function normalizeAuditQuery(query?: AuditQuery) {
  if (!query) return undefined

  return {
    ...normalizeOperationalQuery(query),
    action: query.action,
    actor_id: query.actor_id,
    auditable_type: query.auditable_type,
    trace_id: query.trace_id,
    request_id: query.request_id,
  }
}

const endpoints = {
  analytics: '/api/v1/analytics',
  audit: '/api/v1/audit',
  jobs: '/api/v1/jobs',
  quarantine: '/api/v1/quarantine',
  quarantineDlq: '/api/v1/quarantine/dlq',
  dlqReplayRequests: '/api/v1/dlq-replay-requests',
  notifications: '/api/v1/notifications',
  notificationSettings: '/api/v1/notification-settings',
  uploads: '/api/v1/uploads',
  uploadPublicLink: '/api/v1/uploads/public-link',
  uploadSignedUrl: '/api/v1/uploads/signed-url',
} as const

export function createIdempotencyKey(scope = 'operation') {
  const randomId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return `streamgate:${scope}:${randomId}`
}

function operationBody(reason: string, payload?: Record<string, unknown>) {
  return {
    operation: {
      reason,
      ...(payload ? { payload } : {}),
    },
  }
}

function idempotencyHeaders(key?: string) {
  return { 'Idempotency-Key': key ?? createIdempotencyKey() }
}

async function patchEnvelope<T>(client: StreamgateHttpClient, path: string, options?: RequestOptions): Promise<ApiSuccessEnvelope<T>> {
  if (client.patchEnvelope) return client.patchEnvelope<T>(path, options)
  if (!client.patch) throw new Error('HTTP PATCH is not available in this client.')
  const data = await client.patch<T>(path, options)
  return { data }
}

async function deleteEnvelope<T>(client: StreamgateHttpClient, path: string, options?: RequestOptions): Promise<ApiSuccessEnvelope<T>> {
  if (client.deleteEnvelope) return client.deleteEnvelope<T>(path, options)
  if (!client.delete) throw new Error('HTTP DELETE is not available in this client.')
  const data = await client.delete<T>(path, options)
  return { data }
}

export function createStreamgateApi(client: StreamgateHttpClient = apiClient) {
  return {
    health: () => client.get<HealthResponse>('/up', undefined),

    requestUploadSignedUrl: async (input: UploadSignedUrlRequest): Promise<ApiSuccessEnvelope<UploadSignedUrlResponse>> => {
      const body = {
        upload: {
          filename: input.filename,
          content_type: input.contentType,
          byte_size: input.byteSize,
          checksum_sha256: input.checksumSha256,
        },
      }

      if (client.postEnvelope) {
        return client.postEnvelope<UploadSignedUrlResponse>(endpoints.uploadSignedUrl, { body })
      }

      const data = await client.post<UploadSignedUrlResponse>(endpoints.uploadSignedUrl, { body })
      return { data }
    },

    registerUpload: async (input: UploadRegisterRequest): Promise<ApiSuccessEnvelope<UploadRegisterResponse>> => {
      const body = {
        upload: {
          filename: input.filename,
          content_type: input.contentType,
          byte_size: input.byteSize,
          checksum_sha256: input.checksumSha256,
          storage_key: input.storageKey,
          metadata: input.metadata,
        },
      }

      if (client.postEnvelope) {
        return client.postEnvelope<UploadRegisterResponse>(endpoints.uploads, { body })
      }

      const data = await client.post<UploadRegisterResponse>(endpoints.uploads, { body })
      return { data }
    },

    createPublicLinkUpload: async (input: PublicLinkUploadRequest): Promise<ApiSuccessEnvelope<PublicLinkUploadResponse>> => {
      const options = {
        body: {
          public_link: {
            url: input.url,
            filename: input.filename,
            content_type: input.contentType,
            byte_size: input.byteSize,
          },
        },
        headers: idempotencyHeaders(input.idempotencyKey),
      }

      if (client.postEnvelope) {
        return client.postEnvelope<PublicLinkUploadResponse>(endpoints.uploadPublicLink, options)
      }

      const data = await client.post<PublicLinkUploadResponse>(endpoints.uploadPublicLink, options)
      return { data }
    },

    listJobs: async (query?: ListQuery): Promise<ApiSuccessEnvelope<JobSummary[]>> => {
      const normalizedQuery = normalizeListQuery(query)

      if (client.getEnvelope) {
        return client.getEnvelope<JobSummary[]>(endpoints.jobs, { query: normalizedQuery })
      }

      const data = await client.get<JobSummary[]>(endpoints.jobs, { query: normalizedQuery })
      return { data }
    },

    listUploads: async (query?: ListQuery): Promise<ApiSuccessEnvelope<UploadSummary[]>> => {
      const normalizedQuery = normalizeListQuery(query)

      if (client.getEnvelope) {
        return client.getEnvelope<UploadSummary[]>(endpoints.uploads, { query: normalizedQuery })
      }

      const data = await client.get<UploadSummary[]>(endpoints.uploads, { query: normalizedQuery })
      return { data }
    },

    getAnalytics: async (query?: OperationalQuery): Promise<ApiSuccessEnvelope<AnalyticsSnapshot>> => {
      const normalizedQuery = normalizeOperationalQuery(query)

      if (client.getEnvelope) {
        return client.getEnvelope<AnalyticsSnapshot>(endpoints.analytics, { query: normalizedQuery })
      }

      const data = await client.get<AnalyticsSnapshot>(endpoints.analytics, { query: normalizedQuery })
      return { data }
    },

    getAnalyticsDashboard: async (query?: OperationalQuery): Promise<ApiSuccessEnvelope<AnalyticsDashboardSnapshot>> => {
      const normalizedQuery = normalizeOperationalQuery(query)
      const path = `${endpoints.analytics}/dashboard`

      if (client.getEnvelope) {
        return client.getEnvelope<AnalyticsDashboardSnapshot>(path, { query: normalizedQuery })
      }

      const data = await client.get<AnalyticsDashboardSnapshot>(path, { query: normalizedQuery })
      return { data }
    },

    getAnalyticsWarehouse: async (query?: OperationalQuery): Promise<ApiSuccessEnvelope<AnalyticsWarehouseSnapshot>> => {
      const normalizedQuery = normalizeOperationalQuery(query)
      const path = `${endpoints.analytics}/warehouse`

      if (client.getEnvelope) {
        return client.getEnvelope<AnalyticsWarehouseSnapshot>(path, { query: normalizedQuery })
      }

      const data = await client.get<AnalyticsWarehouseSnapshot>(path, { query: normalizedQuery })
      return { data }
    },

    getAnalyticsLineage: async (jobId: string): Promise<ApiSuccessEnvelope<AnalyticsLineage>> => {
      const path = `${endpoints.analytics}/lineage`
      const query = { job_id: jobId }

      if (client.getEnvelope) {
        return client.getEnvelope<AnalyticsLineage>(path, { query })
      }

      const data = await client.get<AnalyticsLineage>(path, { query })
      return { data }
    },

    listQuarantine: async (query?: QuarantineQuery): Promise<ApiSuccessEnvelope<QuarantineRecord[]>> => {
      const normalizedQuery = normalizeQuarantineQuery(query)

      if (client.getEnvelope) {
        return client.getEnvelope<QuarantineRecord[]>(endpoints.quarantine, { query: normalizedQuery })
      }

      const data = await client.get<QuarantineRecord[]>(endpoints.quarantine, { query: normalizedQuery })
      return { data }
    },

    listQuarantineDlq: async (query?: DlqQuery): Promise<ApiSuccessEnvelope<DlqMessage[]>> => {
      const normalizedQuery = normalizeDlqQuery(query)

      if (client.getEnvelope) {
        return client.getEnvelope<DlqMessage[]>(endpoints.quarantineDlq, { query: normalizedQuery })
      }

      const data = await client.get<DlqMessage[]>(endpoints.quarantineDlq, { query: normalizedQuery })
      return { data }
    },

    retryJob: async (jobId: string, input: OperationActionInput): Promise<ApiSuccessEnvelope<OperationActionResponse>> => {
      const path = `${endpoints.jobs}/${jobId}/retry`

      if (client.postEnvelope) {
        return client.postEnvelope<OperationActionResponse>(path, {
          body: operationBody(input.reason),
          headers: idempotencyHeaders(input.idempotencyKey),
        })
      }

      const data = await client.post<OperationActionResponse>(path, {
        body: operationBody(input.reason),
        headers: idempotencyHeaders(input.idempotencyKey),
      })
      return { data }
    },

    resolveQuarantine: async (recordId: string, input: OperationActionInput): Promise<ApiSuccessEnvelope<QuarantineResolveResponse>> => {
      const path = `${endpoints.quarantine}/${recordId}/resolve`

      if (client.postEnvelope) {
        return client.postEnvelope<QuarantineResolveResponse>(path, {
          body: operationBody(input.reason),
          headers: idempotencyHeaders(input.idempotencyKey),
        })
      }

      const data = await client.post<QuarantineResolveResponse>(path, {
        body: operationBody(input.reason),
        headers: idempotencyHeaders(input.idempotencyKey),
      })
      return { data }
    },

    createDlqReplayRequest: async (messageId: string, input: OperationActionInput & { payload?: Record<string, unknown> }): Promise<ApiSuccessEnvelope<DlqReplayRequest>> => {
      const path = `${endpoints.quarantineDlq}/${messageId}/replay-requests`

      if (client.postEnvelope) {
        return client.postEnvelope<DlqReplayRequest>(path, {
          body: operationBody(input.reason, input.payload),
          headers: idempotencyHeaders(input.idempotencyKey),
        })
      }

      const data = await client.post<DlqReplayRequest>(path, {
        body: operationBody(input.reason, input.payload),
        headers: idempotencyHeaders(input.idempotencyKey),
      })
      return { data }
    },

    approveDlqReplayRequest: async (requestId: string, input: OperationActionInput): Promise<ApiSuccessEnvelope<DlqReplayRequest>> => {
      const path = `${endpoints.dlqReplayRequests}/${requestId}/approve`

      if (client.postEnvelope) {
        return client.postEnvelope<DlqReplayRequest>(path, {
          body: operationBody(input.reason),
          headers: idempotencyHeaders(input.idempotencyKey),
        })
      }

      const data = await client.post<DlqReplayRequest>(path, {
        body: operationBody(input.reason),
        headers: idempotencyHeaders(input.idempotencyKey),
      })
      return { data }
    },

    executeDlqReplayRequest: async (requestId: string, input: OperationActionInput): Promise<ApiSuccessEnvelope<DlqReplayRequest>> => {
      const path = `${endpoints.dlqReplayRequests}/${requestId}/execute`

      if (client.postEnvelope) {
        return client.postEnvelope<DlqReplayRequest>(path, {
          body: operationBody(input.reason),
          headers: idempotencyHeaders(input.idempotencyKey),
        })
      }

      const data = await client.post<DlqReplayRequest>(path, {
        body: operationBody(input.reason),
        headers: idempotencyHeaders(input.idempotencyKey),
      })
      return { data }
    },

    listJobArtifacts: async (jobId: string): Promise<ApiSuccessEnvelope<JobArtifact[]>> => {
      const path = `${endpoints.jobs}/${jobId}/artifacts`

      if (client.getEnvelope) {
        return client.getEnvelope<JobArtifact[]>(path)
      }

      const data = await client.get<JobArtifact[]>(path)
      return { data }
    },

    createArtifactDownloadUrl: async (jobId: string, artifactId: string): Promise<ApiSuccessEnvelope<ArtifactDownloadUrlResponse>> => {
      const path = `${endpoints.jobs}/${jobId}/artifacts/${artifactId}/download-url`

      if (client.postEnvelope) {
        return client.postEnvelope<ArtifactDownloadUrlResponse>(path)
      }

      const data = await client.post<ArtifactDownloadUrlResponse>(path)
      return { data }
    },

    listNotifications: async (query?: { status?: 'active' | NotificationStatus }): Promise<ApiSuccessEnvelope<NotificationItem[]>> => {
      if (client.getEnvelope) {
        return client.getEnvelope<NotificationItem[]>(endpoints.notifications, { query })
      }

      const data = await client.get<NotificationItem[]>(endpoints.notifications, { query })
      return { data }
    },

    markNotificationRead: (notificationId: string) =>
      patchEnvelope<NotificationItem>(client, `${endpoints.notifications}/${notificationId}/read`),

    archiveNotification: (notificationId: string) =>
      patchEnvelope<NotificationItem>(client, `${endpoints.notifications}/${notificationId}/archive`),

    unarchiveNotification: (notificationId: string) =>
      patchEnvelope<NotificationItem>(client, `${endpoints.notifications}/${notificationId}/unarchive`),

    deleteNotification: (notificationId: string) =>
      deleteEnvelope<{ deleted: boolean; id: string }>(client, `${endpoints.notifications}/${notificationId}`),

    markAllNotificationsRead: (status: 'active' | NotificationStatus = 'active') =>
      patchEnvelope<NotificationBulkResponse>(client, `${endpoints.notifications}/mark-all-read`, { query: { status } }),

    bulkArchiveNotifications: (ids: string[]) =>
      patchEnvelope<NotificationBulkResponse>(client, `${endpoints.notifications}/bulk-archive`, { body: { notifications: { ids } } }),

    getNotificationSettings: async (): Promise<ApiSuccessEnvelope<NotificationSettings>> => {
      if (client.getEnvelope) return client.getEnvelope<NotificationSettings>(endpoints.notificationSettings)
      const data = await client.get<NotificationSettings>(endpoints.notificationSettings)
      return { data }
    },

    updateNotificationSettings: (input: NotificationSettingsInput) =>
      patchEnvelope<NotificationSettings>(client, endpoints.notificationSettings, {
        body: {
          notification_setting: {
            in_app_enabled: input.inAppEnabled,
            email_enabled: input.emailEnabled,
            webhook_enabled: input.webhookEnabled,
            webhook_url: input.webhookUrl,
          },
        },
      }),

    testWebhookNotification: (input: OperationActionInput) => {
      const path = `${endpoints.notificationSettings}/webhook/test`

      if (client.postEnvelope) {
        return client.postEnvelope<WebhookDeliveryResponse>(path, {
          body: operationBody(input.reason),
          headers: idempotencyHeaders(input.idempotencyKey),
        })
      }

      return client.post<WebhookDeliveryResponse>(path, {
        body: operationBody(input.reason),
        headers: idempotencyHeaders(input.idempotencyKey),
      }).then((data) => ({ data }))
    },

    listAuditEvents: async (query?: AuditQuery): Promise<ApiSuccessEnvelope<AuditEvent[]>> => {
      const normalizedQuery = normalizeAuditQuery(query)

      if (client.getEnvelope) {
        return client.getEnvelope<AuditEvent[]>(endpoints.audit, { query: normalizedQuery })
      }

      const data = await client.get<AuditEvent[]>(endpoints.audit, { query: normalizedQuery })
      return { data }
    },

    auth: {
      register: (input: RegisterInput) =>
        client.post<AuthPayload>('/api/v1/auth/register', {
          body: {
            registration: {
              full_name: input.fullName,
              email: input.email,
              password: input.password,
              password_confirmation: input.passwordConfirmation,
            },
          },
        }),

      login: (input: LoginInput) =>
        client.post<AuthPayload>('/api/v1/auth/login', {
          body: {
            session: {
              email: input.email,
              password: input.password,
            },
          },
        }),

      logout: () => client.post<MessagePayload>('/api/v1/auth/logout', undefined),

      me: () => client.get<{ user: AuthUser; session: AuthSession }>('/api/v1/auth/me', undefined),

      refresh: () =>
        client.post<SessionRefreshPayload>('/api/v1/auth/session/refresh', undefined),

      requestPasswordReset: ({ email }: { email: string }) =>
        client.post<PasswordResetRequestPayload>('/api/v1/auth/password/reset/request', {
          body: {
            password_reset: {
              email,
            },
          },
        }),

      confirmPasswordReset: (input: PasswordResetConfirmInput) =>
        client.post<MessagePayload>('/api/v1/auth/password/reset/confirm', {
          body: {
            password_reset_confirmation: {
              token: input.token,
              password: input.password,
              password_confirmation: input.passwordConfirmation,
            },
          },
        }),
    },
  }
}

export const streamgateApi = createStreamgateApi(apiClient)
