export type ApiSuccessEnvelope<T> = {
  data: T
  meta?: {
    pagination?: {
      page: number
      per_page: number
      total_count: number
      total_pages: number
    }
    filters?: Record<string, string | number | boolean | null | string[]>
    idempotent?: boolean
  }
}

export type ApiErrorDetail = {
  field?: string
  reason: string
}

export type ApiErrorEnvelope = {
  error: {
    code: string
    message: string
    request_id: string
    trace_id: string
    details?: ApiErrorDetail[]
  }
}

export class ApiClientError extends Error {
  status: number
  code: string
  requestId: string | null
  traceId: string | null
  details: ApiErrorDetail[]

  constructor({
    status,
    message,
    code,
    requestId,
    traceId,
    details = [],
  }: {
    status: number
    message: string
    code: string
    requestId: string | null
    traceId: string | null
    details?: ApiErrorDetail[]
  }) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
    this.requestId = requestId
    this.traceId = traceId
    this.details = details
  }
}

export type RequestOptions = Omit<RequestInit, 'body'> & {
  query?: Record<string, string | number | boolean | null | undefined | Array<string | number | boolean>>
  body?: unknown
  headers?: HeadersInit
  traceId?: string
}

export type ApiClientAuthConfig = {
  getAccessToken?: () => string | null
  onAuthFailure?: (error: ApiClientError) => void
}

let authConfig: ApiClientAuthConfig = {}

export function configureApiClientAuth(config: ApiClientAuthConfig) {
  authConfig = {
    getAccessToken: config.getAccessToken,
    onAuthFailure: config.onAuthFailure,
  }
}

function shouldHandleAuthFailure(error: ApiClientError) {
  if (error.status !== 401 && error.status !== 403) {
    return false
  }

  return error.code === 'session_expired' || error.code === 'access_denied'
}

export function buildQueryString(query?: RequestOptions['query']) {
  if (!query) return ''

  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return

    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, String(entry)))
      return
    }

    params.set(key, String(value))
  })

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

export function resolveApiBaseUrl() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
  return baseUrl && baseUrl.length > 0 ? baseUrl : 'http://localhost:3000'
}

export function createApiClient(baseUrl = resolveApiBaseUrl()) {
  async function requestEnvelope<T>(path: string, options: RequestOptions = {}) {
    const { query, body, headers, traceId, ...rest } = options
    const url = `${baseUrl}${path}${buildQueryString(query)}`

    const accessToken = authConfig.getAccessToken?.()

    const response = await fetch(url, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(traceId ? { 'X-Trace-Id': traceId } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const isJson = response.headers.get('content-type')?.includes('application/json') ?? false
    const payload = isJson ? ((await response.json()) as ApiSuccessEnvelope<T> | ApiErrorEnvelope) : null

    if (!response.ok) {
      const errorPayload = (payload as ApiErrorEnvelope | null)?.error
      const error = new ApiClientError({
        status: response.status,
        message: errorPayload?.message ?? 'Nao foi possivel concluir a requisicao.',
        code: errorPayload?.code ?? 'unknown_error',
        requestId: errorPayload?.request_id ?? null,
        traceId: errorPayload?.trace_id ?? null,
        details: errorPayload?.details ?? [],
      })

      if (shouldHandleAuthFailure(error)) {
        authConfig.onAuthFailure?.(error)
      }

      throw error
    }

    return payload as ApiSuccessEnvelope<T>
  }

  async function request<T>(path: string, options: RequestOptions = {}) {
    const envelope = await requestEnvelope<T>(path, options)
    return envelope.data
  }

  return {
    request,
    get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'POST' }),
    patch: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'PATCH' }),
    delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
    getEnvelope: <T>(path: string, options?: RequestOptions) => requestEnvelope<T>(path, { ...options, method: 'GET' }),
    postEnvelope: <T>(path: string, options?: RequestOptions) => requestEnvelope<T>(path, { ...options, method: 'POST' }),
    patchEnvelope: <T>(path: string, options?: RequestOptions) => requestEnvelope<T>(path, { ...options, method: 'PATCH' }),
    deleteEnvelope: <T>(path: string, options?: RequestOptions) => requestEnvelope<T>(path, { ...options, method: 'DELETE' }),
  }
}

export const apiClient = createApiClient()
