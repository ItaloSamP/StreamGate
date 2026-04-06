import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiClientError, buildQueryString, createApiClient } from '@/lib/api-client'

const originalFetch = global.fetch

afterEach(() => {
  vi.restoreAllMocks()
  global.fetch = originalFetch
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
})
