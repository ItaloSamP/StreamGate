import { describe, expect, it, vi } from 'vitest'

import {
  buildCsv,
  buildOperationalQuery,
  humanizeOperationalError,
  maskOperationalPayload,
  readOperationalQueryState,
  shouldMarkStale,
} from '@/lib/operational-utils'
import { ApiClientError } from '@/lib/api-client'

describe('operational utils', () => {
  it('reads complete operational URL state with stable defaults', () => {
    const params = new URLSearchParams('preset=last_24h&page=3&per_page=50&sort_by=created_at&sort_order=asc&search=job_1')

    expect(readOperationalQueryState(params)).toEqual({
      preset: 'last_24h',
      from: undefined,
      to: undefined,
      timezone: 'UTC',
      page: 3,
      per_page: 50,
      sort_by: 'created_at',
      sort_order: 'asc',
      search: 'job_1',
    })
  })

  it('builds API query params while skipping empty values', () => {
    expect(buildOperationalQuery({
      preset: 'last_7d',
      timezone: 'UTC',
      page: 1,
      per_page: 20,
      sort_by: 'occurred_at',
      sort_order: 'desc',
      search: '',
    })).toEqual({
      preset: 'last_7d',
      timezone: 'UTC',
      page: 1,
      per_page: 20,
      sort_by: 'occurred_at',
      sort_order: 'desc',
    })
  })

  it('masks sensitive payload keys before rendering or export', () => {
    expect(maskOperationalPayload({
      upload_id: 'upload_1',
      trace_id: 'trace_1',
      cpf: '12345678900',
      token: 'secret',
      nested: {
        password: 'hidden',
      },
    })).toEqual({
      upload_id: 'upload_1',
      trace_id: 'trace_1',
      cpf: '[masked]',
      token: '[masked]',
      nested: {
        password: '[masked]',
      },
    })
  })

  it('exports csv with stable headers and masked values', () => {
    const csv = buildCsv(
      [
        { id: 'audit_1', action: 'upload.registered', token: 'secret' },
      ],
      ['id', 'action', 'token'],
    )

    expect(csv).toBe('id,action,token\r\naudit_1,upload.registered,[masked]')
  })

  it('humanizes API errors with details and detects stale snapshots', () => {
    vi.setSystemTime(new Date('2026-04-15T12:06:00Z'))

    const message = humanizeOperationalError(
      new ApiClientError({
        status: 422,
        message: 'Filtro invalido.',
        code: 'validation_failed',
        requestId: 'req_1',
        traceId: 'trace_1',
        details: [{ field: 'sort_by', reason: 'not_allowed' }],
      }),
      'Falha operacional.',
    )

    expect(message).toBe('Filtro invalido. (validation_failed) sort_by: not_allowed')
    expect(shouldMarkStale(new Date('2026-04-15T12:00:00Z'), 5)).toBe(true)

    vi.useRealTimers()
  })
})
