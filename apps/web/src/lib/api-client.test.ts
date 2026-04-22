import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  ApiClientError,
  buildQueryString,
  configureApiClientAuth,
  createApiClient,
} from '@/lib/api-client'

const originalFetch = global.fetch

afterEach(() => {
  vi.restoreAllMocks()
  global.fetch = originalFetch
  configureApiClientAuth({
    getAccessToken: undefined,
    onAuthFailure: undefined,
  })
})

describe('buildQueryString', () => {
  it('serializes query params while skipping empty values', () => {
    expect(buildQueryString({ status: 'pending', page: 2, empty: '', ignored: undefined, labels: ['etl', 'ops'] })).toBe(
      '?status=pending&page=2&labels=etl&labels=ops',
    )
  })
})

describe('createApiClient', () => {
  it('sends json requests with trace header and returns data', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: { status: 'ok' } }),
    })
    global.fetch = fetchMock as typeof fetch

    const client = createApiClient('http://localhost:3000')
    const result = await client.get<{ status: string }>('/up', { traceId: 'trace_front_test' })

    expect(result).toEqual({ status: 'ok' })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/up',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
          'X-Trace-Id': 'trace_front_test',
        }),
      }),
    )
  })

  it('can return the full envelope when pagination metadata is needed', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        data: [{ id: 'job_1' }],
        meta: {
          pagination: {
            page: 1,
            per_page: 20,
            total_count: 1,
            total_pages: 1,
          },
          filters: {
            status: 'pending',
          },
        },
      }),
    }) as typeof fetch

    const client = createApiClient('http://localhost:3000')
    const result = await client.getEnvelope<{ id: string }[]>('/api/v1/jobs', {
      query: { status: 'pending', page: 1, per_page: 20 },
    })

    expect(result.meta?.pagination?.page).toBe(1)
    expect(result.meta?.filters?.status).toBe('pending')
  })

  it('injects bearer token when auth config provides one', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: { id: 'user_1' } }),
    })
    global.fetch = fetchMock as typeof fetch

    configureApiClientAuth({
      getAccessToken: () => 'token_123',
    })

    const client = createApiClient('http://localhost:3000')
    await client.get('/api/v1/auth/me')

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/auth/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token_123',
        }),
      }),
    )
  })

  it('raises a typed client error for api failures', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        error: {
          code: 'validation_failed',
          message: 'Payload invalido.',
          request_id: 'req_front_test',
          trace_id: 'trace_front_test',
          details: [{ field: 'status', reason: 'unknown' }],
        },
      }),
    }) as typeof fetch

    const client = createApiClient('http://localhost:3000')

    await expect(client.get('/jobs')).rejects.toEqual(
      expect.objectContaining<ApiClientError>({
        status: 422,
        code: 'validation_failed',
        requestId: 'req_front_test',
        traceId: 'trace_front_test',
      }),
    )
  })

  it('calls auth failure callback on expired session errors', async () => {
    const onAuthFailure = vi.fn()

    configureApiClientAuth({
      getAccessToken: () => 'expired_token',
      onAuthFailure,
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        error: {
          code: 'session_expired',
          message: 'Sessao expirada.',
          request_id: 'req_expired',
          trace_id: 'trace_expired',
        },
      }),
    }) as typeof fetch

    const client = createApiClient('http://localhost:3000')

    await expect(client.get('/api/v1/auth/me')).rejects.toBeInstanceOf(ApiClientError)
    expect(onAuthFailure).toHaveBeenCalledTimes(1)
    expect(onAuthFailure).toHaveBeenCalledWith(
      expect.objectContaining<ApiClientError>({
        code: 'session_expired',
        status: 401,
      }),
    )
  })

  it('does not clear auth state on access denied responses for protected resources', async () => {
    const onAuthFailure = vi.fn()

    configureApiClientAuth({
      getAccessToken: () => 'valid_token',
      onAuthFailure,
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        error: {
          code: 'access_denied',
          message: 'Sem permissao para acessar este recurso.',
          request_id: 'req_denied',
          trace_id: 'trace_denied',
        },
      }),
    }) as typeof fetch

    const client = createApiClient('http://localhost:3000')

    await expect(client.get('/api/v1/audit')).rejects.toBeInstanceOf(ApiClientError)
    expect(onAuthFailure).not.toHaveBeenCalled()
  })
})
