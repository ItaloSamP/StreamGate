import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { createStoredAuthSession, storeAuthSession } from '@/lib/auth'
import { AuthProvider } from '@/features/auth/auth-context'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
})

function renderProtectedEntry(initialEntry: string) {
  window.localStorage.clear()
  window.sessionStorage.clear()

  storeAuthSession(
    createStoredAuthSession({
      remember: true,
      user: {
        id: 'user_1',
        email: 'ana@empresa.com',
        full_name: 'Ana Costa',
        role: 'operator',
        status: 'active',
      },
      session: {
        id: 'sess_1',
        token_type: 'Bearer',
        access_token: 'token_valid',
        expires_at: '2099-04-07T12:00:00Z',
      },
    }),
  )

  global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = String(input)

    if (url.includes('/api/v1/auth/me')) {
      return Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: {
            user: {
              id: 'user_1',
              email: 'ana@empresa.com',
              full_name: 'Ana Costa',
              role: 'operator',
              status: 'active',
            },
            session: {
              id: 'sess_1',
              user_id: 'user_1',
              expires_at: '2099-04-07T12:00:00Z',
              revoked_at: null,
              last_seen_at: null,
              trace_id: 'trace_1',
            },
          },
        }),
      } as Response)
    }

    if (url.includes('/api/v1/jobs')) {
      return Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: [
            {
              id: 'job_1',
              upload_id: 'upload_1',
              requested_by_id: 'user_1',
              source_type: 'upload',
              status: 'pending',
              error_code: null,
              error_category: null,
              quarantined_records_count: 0,
              trace_id: 'trace_job_1',
              created_at: '2026-04-08T10:00:00Z',
              updated_at: '2026-04-08T10:00:00Z',
            },
          ],
          meta: {
            pagination: {
              page: 1,
              per_page: 20,
              total_count: 1,
              total_pages: 1,
            },
            filters: {},
          },
        }),
      } as Response)
    }

    if (url.includes('/api/v1/analytics/warehouse')) {
      return Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: {
            source: 'clickhouse',
            generated_at: '2026-04-24T14:00:00Z',
            last_event_at: '2026-04-24T13:59:40Z',
            lag_seconds: 20,
            stale: false,
            slo_target_seconds: 300,
            p95_ms: 240,
            error_budget_percent: 99.9,
            dependency_status: { clickhouse: 'healthy', postgres: 'healthy' },
            fallback_reason: null,
            aggregates: {
              jobs_total: 1,
              uploads_total: 1,
              records_total: 1200,
              valid_records: 1198,
              invalid_records: 2,
              by_status: { pending: 1 },
              by_source: { upload: 1 },
            },
          },
        }),
      } as Response)
    }

    if (url.includes('/api/v1/analytics/lineage')) {
      return Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: {
            job: {
              id: 'job_1',
              upload_id: 'upload_1',
              requested_by_id: 'user_1',
              source_type: 'upload',
              status: 'pending',
              error_code: null,
              error_category: null,
              quarantined_records_count: 0,
              trace_id: 'trace_job_1',
              created_at: '2026-04-08T10:00:00Z',
              updated_at: '2026-04-08T10:00:00Z',
            },
            upload: {
              id: 'upload_1',
              filename: 'input.csv',
              content_type: 'text/csv',
              byte_size: 128,
              checksum_sha256: 'a'.repeat(64),
              storage_key: 'uploads/input.csv',
              status: 'registered',
              sensitivity_level: 'internal',
              user_id: 'user_1',
              trace_id: 'trace_upload_1',
              created_at: '2026-04-08T10:00:00Z',
              updated_at: '2026-04-08T10:00:00Z',
            },
            acquisition: null,
            batches: [],
            attempts: [],
            quarantine: [],
            artifacts: [],
            warnings: [],
            audit_refs: [],
          },
        }),
      } as Response)
    }

    return Promise.resolve({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: [] }),
    } as Response)
  }) as typeof fetch

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe.skip('workspace routes', () => {
  it('renders jobs route inside the protected workspace shell', async () => {
    renderProtectedEntry('/jobs')

    expect((await screen.findAllByText('Leitura real de jobs')).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /Quarentena/i })).toBeInTheDocument()
  })

  it('renders analytics route with dedicated title', async () => {
    renderProtectedEntry('/analytics')

    expect((await screen.findAllByText('Analytics Workspace')).length).toBeGreaterThan(0)
    expect(screen.getByText('Command Center Analytics')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ClickHouse/i })).toBeInTheDocument()
  })

  it('renders ClickHouse and ETL Explorer as protected real analytical routes for operators', async () => {
    const { unmount } = renderProtectedEntry('/clickhouse')

    expect(await screen.findByText('Warehouse operacional')).toBeInTheDocument()
    expect(await screen.findByText('Fonte: clickhouse')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ETL Explorer/i })).toBeInTheDocument()

    unmount()
    renderProtectedEntry('/etl-explorer')

    expect(await screen.findByText('Lineage real')).toBeInTheDocument()
    expect(await screen.findByText('job_1')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ClickHouse/i })).toBeInTheDocument()
  })
})
