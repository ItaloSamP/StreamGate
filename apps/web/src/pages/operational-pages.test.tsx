import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { AuthProvider } from '@/features/auth/auth-context'
import { createStoredAuthSession, storeAuthSession } from '@/lib/auth'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { QuarantinePage } from '@/pages/QuarantinePage'

const originalFetch = global.fetch

function renderProtectedRoute(element: React.ReactElement, path: string, initialEntry: string, role: 'operator' | 'admin' = 'admin') {
  seedSession(role)

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path={path} element={element} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

function renderApp(initialEntry: string, role: 'operator' | 'admin' = 'admin') {
  seedSession(role)

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('Sprint 4 operational pages', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    global.fetch = createOperationalFetchMock() as typeof fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('renders analytics from the real endpoint and preserves URL filters', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>

    renderProtectedRoute(<AnalyticsPage />, '/analytics', '/analytics?preset=last_24h&sort_by=count&sort_order=desc')

    expect(await screen.findByText('Command Center Analytics')).toBeInTheDocument()
    expect(screen.getAllByText('12').length).toBeGreaterThan(0)
    expect(screen.getByText('Jobs totais')).toBeInTheDocument()
    expect(screen.getByText('completed')).toBeInTheDocument()

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/v1/analytics?preset=last_24h'))).toBe(true)
    })
  })

  it('renders quarantine records and admin-only DLQ inspection from real endpoints', async () => {
    renderProtectedRoute(<QuarantinePage />, '/quarantine', '/quarantine?severity=warning', 'admin')

    expect(await screen.findByText('CPF ausente na linha importada.')).toBeInTheDocument()
    expect(screen.getByText('DLQ read-only')).toBeInTheDocument()
    expect(screen.getByText('max_retries_exceeded')).toBeInTheDocument()
    expect(screen.getAllByText('trace_fixture_1').length).toBeGreaterThan(0)
  })

  it('hides audit navigation for operators and renders it for admins', async () => {
    const { unmount } = renderApp('/dashboard', 'operator')

    expect(await screen.findByText('Command Center Operacional')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Auditoria/i })).not.toBeInTheDocument()

    unmount()

    renderApp('/dashboard', 'admin')

    expect(await screen.findByRole('link', { name: /Auditoria/i })).toBeInTheDocument()
  })

  it('turns dashboard into a real command center instead of mock metrics', async () => {
    renderApp('/dashboard', 'admin')

    expect(await screen.findByText('Command Center Operacional')).toBeInTheDocument()
    expect(await screen.findByText('Jobs totais')).toBeInTheDocument()
    expect((await screen.findAllByText('Quarentena')).length).toBeGreaterThan(0)
    expect(screen.queryByText('1.84 M')).not.toBeInTheDocument()
  })

  it('renders audit-backed event log with copied operational context', async () => {
    renderApp('/events', 'admin')

    expect(await screen.findByText('Event Log Operacional')).toBeInTheDocument()
    expect(await screen.findByText('upload.registered')).toBeInTheDocument()
    expect(await screen.findByText('req_fixture_1')).toBeInTheDocument()
  })

  it('renders shareable operational detail routes with masked context', async () => {
    const { unmount } = renderApp('/jobs/job_fixture_pending', 'admin')

    expect(await screen.findByText('Detalhe do job')).toBeInTheDocument()
    expect(await screen.findByText('job_fixture_pending')).toBeInTheDocument()

    unmount()

    renderApp('/quarantine/quarantine_fixture_warning', 'admin')

    expect(await screen.findByText('Detalhe da quarentena')).toBeInTheDocument()
    expect((await screen.findAllByText((_, node) => node?.textContent?.includes('[masked]') ?? false)).length).toBeGreaterThan(0)

    unmount()

    renderApp('/audit/audit_fixture_registered', 'admin')

    expect(await screen.findByText('Detalhe de auditoria')).toBeInTheDocument()
    expect(await screen.findByText('upload.registered')).toBeInTheDocument()

    unmount()

    renderApp('/quarantine/dlq/0', 'admin')

    expect(await screen.findByText('Detalhe da DLQ')).toBeInTheDocument()
    expect(await screen.findByText('max_retries_exceeded')).toBeInTheDocument()
  })
})

function seedSession(role: 'operator' | 'admin') {
  storeAuthSession(
    createStoredAuthSession({
      remember: true,
      user: {
        id: `user_fixture_${role}`,
        email: `${role}@streamgate.local`,
        full_name: role === 'admin' ? 'Admin StreamGate' : 'Operator StreamGate',
        role,
        status: 'active',
      },
      session: {
        id: `sess_${role}`,
        token_type: 'Bearer',
        access_token: `token_${role}`,
        expires_at: '2099-04-07T12:00:00Z',
      },
    }),
  )
}

function createOperationalFetchMock() {
  return vi.fn().mockImplementation((input: RequestInfo | URL) => {
    const url = String(input)

    if (url.includes('/api/v1/auth/me')) {
      const role = url.includes('unused') ? 'operator' : readRoleFromStoredSession()
      return Promise.resolve(jsonResponse(200, {
        data: {
          user: {
            id: `user_fixture_${role}`,
            email: `${role}@streamgate.local`,
            full_name: role === 'admin' ? 'Admin StreamGate' : 'Operator StreamGate',
            role,
            status: 'active',
          },
          session: {
            id: `sess_${role}`,
            user_id: `user_fixture_${role}`,
            expires_at: '2099-04-07T12:00:00Z',
            revoked_at: null,
            last_seen_at: null,
            trace_id: 'trace_auth',
          },
        },
      }))
    }

    if (url.includes('/api/v1/analytics')) {
      return Promise.resolve(jsonResponse(200, analyticsResponse()))
    }

    if (url.includes('/api/v1/quarantine/dlq')) {
      return Promise.resolve(jsonResponse(200, dlqResponse()))
    }

    if (url.includes('/api/v1/quarantine')) {
      return Promise.resolve(jsonResponse(200, quarantineResponse()))
    }

    if (url.includes('/api/v1/audit')) {
      return Promise.resolve(jsonResponse(200, auditResponse()))
    }

    if (url.includes('/api/v1/jobs')) {
      return Promise.resolve(jsonResponse(200, jobsResponse()))
    }

    if (url.includes('/api/v1/uploads')) {
      return Promise.resolve(jsonResponse(200, uploadsResponse()))
    }

    return Promise.resolve(jsonResponse(404, {
      error: {
        code: 'not_found',
        message: `endpoint nao mapeado: ${url}`,
        request_id: 'req_unknown',
        trace_id: 'trace_unknown',
      },
    }))
  })
}

function readRoleFromStoredSession() {
  const raw = window.localStorage.getItem('streamgate.auth.session')
  if (!raw) return 'operator'
  return JSON.parse(raw).user.role as 'operator' | 'admin'
}

function analyticsResponse() {
  return {
    data: {
      window: { from: '2026-04-06T00:00:00Z', to: '2026-04-13T00:00:00Z', preset: 'last_7d', timezone: 'UTC' },
      kpis: {
        uploads_total: 12,
        jobs_total: 12,
        jobs_processing: 1,
        jobs_completed: 8,
        jobs_failed: 2,
        jobs_quarantined: 1,
        quarantine_records_total: 4,
        audit_events_total: 32,
      },
      breakdowns: {
        status: [{ status: 'completed', count: 8 }],
        actor: [{ actor_id: 'user_fixture_operator', count: 9 }],
        source: [{ source: 'upload', count: 12 }],
      },
    },
    meta: { pagination: { page: 1, per_page: 20, total_count: 1, total_pages: 1 }, filters: {} },
  }
}

function quarantineResponse() {
  return {
    data: [
      {
        id: 'quarantine_fixture_warning',
        job_id: 'job_fixture_pending',
        job_batch_id: 'batch_fixture_first',
        severity: 'warning',
        code: 'missing_cpf',
        message: 'CPF ausente na linha importada.',
        row_number: 3,
        payload: { cpf: '12345678900', upload_id: 'upload_fixture_registered' },
        trace_id: 'trace_fixture_1',
        created_at: '2026-04-13T12:00:00Z',
        updated_at: '2026-04-13T12:00:00Z',
      },
    ],
    meta: { pagination: { page: 1, per_page: 20, total_count: 1, total_pages: 1 }, filters: {} },
  }
}

function dlqResponse() {
  return {
    data: [
      {
        payload: { event_id: 'event_fixture_1', job_id: 'job_fixture_pending', trace_id: 'trace_fixture_1' },
        exchange: 'streamgate.events',
        routing_key: 'upload.received.v1.dlq',
        redelivered: true,
        retry_count: 3,
        dead_letter_reason: 'max_retries_exceeded',
        headers: { 'x-retry-count': 3 },
      },
    ],
    meta: {
      pagination: { page: 1, per_page: 20, total_count: 1, total_pages: 1 },
      queue: { name: 'streamgate.worker.upload.received.v1.dlq', queue_depth: 1 },
      filters: {},
    },
  }
}

function auditResponse() {
  return {
    data: [
      {
        id: 'audit_fixture_registered',
        action: 'upload.registered',
        actor_id: 'user_fixture_operator',
        auditable_type: 'Upload',
        auditable_id: 'upload_fixture_registered',
        request_id: 'req_fixture_1',
        trace_id: 'trace_fixture_1',
        occurred_at: '2026-04-05T10:00:00Z',
        metadata: { upload_id: 'upload_fixture_registered', token: 'secret' },
        created_at: '2026-04-13T12:00:00Z',
        updated_at: '2026-04-13T12:00:00Z',
      },
    ],
    meta: { pagination: { page: 1, per_page: 20, total_count: 1, total_pages: 1 }, filters: {} },
  }
}

function jobsResponse() {
  return {
    data: [
      {
        id: 'job_fixture_pending',
        upload_id: 'upload_fixture_registered',
        requested_by_id: 'user_fixture_operator',
        source_type: 'upload',
        status: 'processing',
        error_code: null,
        error_category: null,
        quarantined_records_count: 0,
        trace_id: 'trace_fixture_1',
        created_at: '2026-04-08T10:00:00Z',
        updated_at: '2026-04-08T10:00:00Z',
      },
    ],
    meta: { pagination: { page: 1, per_page: 20, total_count: 1, total_pages: 1 }, filters: {} },
  }
}

function uploadsResponse() {
  return {
    data: [
      {
        id: 'upload_fixture_registered',
        filename: 'input.csv',
        content_type: 'text/csv',
        byte_size: 128,
        checksum_sha256: 'a'.repeat(64),
        storage_key: 'uploads/input.csv',
        status: 'registered',
        sensitivity_level: 'internal',
        user_id: 'user_fixture_operator',
        trace_id: 'trace_fixture_1',
        created_at: '2026-04-08T10:00:00Z',
        updated_at: '2026-04-08T10:00:00Z',
      },
    ],
    meta: { pagination: { page: 1, per_page: 20, total_count: 1, total_pages: 1 }, filters: {} },
  }
}

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
  } as Response
}
