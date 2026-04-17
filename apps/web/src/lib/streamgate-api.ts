import { apiClient, type ApiSuccessEnvelope, type RequestOptions } from '@/lib/api-client'

type StreamgateHttpClient = {
  get: <T>(path: string, options?: RequestOptions) => Promise<T>
  post: <T>(path: string, options?: RequestOptions) => Promise<T>
  getEnvelope?: <T>(path: string, options?: RequestOptions) => Promise<ApiSuccessEnvelope<T>>
  postEnvelope?: <T>(path: string, options?: RequestOptions) => Promise<ApiSuccessEnvelope<T>>
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

export type UploadSummary = {
  id: string
  filename: string
  content_type: string
  byte_size: number
  checksum_sha256: string
  storage_key: string
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
  uploads: '/api/v1/uploads',
  uploadSignedUrl: '/api/v1/uploads/signed-url',
} as const

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
