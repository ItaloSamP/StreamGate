import { apiClient, type RequestOptions } from '@/lib/api-client'

type StreamgateHttpClient = {
  get: <T>(path: string, options?: RequestOptions) => Promise<T>
  post: <T>(path: string, options?: RequestOptions) => Promise<T>
}

export type HealthResponse = {
  status: string
}

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

export function createStreamgateApi(client: StreamgateHttpClient = apiClient) {
  return {
    health: () => client.get<HealthResponse>('/up', undefined),
    listJobs: (query?: Record<string, string | number | boolean | null | undefined>) =>
      client.get<JobSummary[]>('/jobs', { query }),
    listUploads: (query?: Record<string, string | number | boolean | null | undefined>) =>
      client.get<UploadSummary[]>('/uploads', { query }),

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
