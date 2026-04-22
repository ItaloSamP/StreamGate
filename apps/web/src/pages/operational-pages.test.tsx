import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

    expect(await screen.findByText('Pipeline de Jobs')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Auditoria/i })).not.toBeInTheDocument()

    unmount()

    renderApp('/dashboard', 'admin')

    expect(await screen.findByRole('link', { name: /Auditoria/i })).toBeInTheDocument()
  }, 15000)

  it('turns dashboard into a real command center instead of mock metrics', async () => {
    renderApp('/dashboard', 'admin')

    expect(await screen.findByText('Volume Processado · ultimas 24h')).toBeInTheDocument()
    expect(await screen.findByText('Pipeline de Jobs')).toBeInTheDocument()
    expect((await screen.findAllByText('Quarentena')).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: '+ Upload' })).toHaveAttribute('href', '/upload')
    expect(screen.getByText('1.840.000')).toBeInTheDocument()
  })

  it('renders audit-backed event log with copied operational context', async () => {
    renderApp('/events', 'admin')

    expect(await screen.findByText('Event Log Operacional')).toBeInTheDocument()
    expect(await screen.findByText('upload.registered')).toBeInTheDocument()
    expect(await screen.findByText('req_fixture_1')).toBeInTheDocument()
  })

  it('keeps the session and shows access denied when operator opens event log', async () => {
    renderApp('/events', 'operator')

    expect(await screen.findByText('Event Log Operacional')).toBeInTheDocument()
    expect(await screen.findByText(/Permissao negada para esta superficie/i)).toBeInTheDocument()
    expect(screen.queryByText(/Acessar workspace/i)).not.toBeInTheDocument()
  })

  it('shows denied states for other admin-only surfaces without dropping the session', async () => {
    const { unmount } = renderApp('/audit', 'operator')

    expect(await screen.findByText('Auditoria operacional')).toBeInTheDocument()
    expect(await screen.findByText(/Permissao negada para esta superficie/i)).toBeInTheDocument()

    unmount()
    renderApp('/operations', 'operator')

    expect(await screen.findByText('Wizard admin-only')).toBeInTheDocument()
    expect(await screen.findByText(/Permissao negada para esta superficie/i)).toBeInTheDocument()

    unmount()
    renderApp('/quarantine/dlq/0', 'operator')

    expect(await screen.findByText('Detalhe da DLQ')).toBeInTheDocument()
    expect(await screen.findByText(/Permissao negada para esta superficie/i)).toBeInTheDocument()
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

  it('renders notification bell and full notification center with rules and channel settings', async () => {
    const { unmount } = renderApp('/dashboard', 'admin')

    expect(await screen.findByLabelText(/notificacoes nao lidas/i)).toBeInTheDocument()

    unmount()
    renderApp('/notifications', 'admin')

    expect(await screen.findByText('Centro de notificacoes')).toBeInTheDocument()
    expect(await screen.findByText('Falha no job')).toBeInTheDocument()
    expect(screen.getByText('critico')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Abrir job/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Regras e canais/i }))

    expect(await screen.findByText('Regras de notificacao')).toBeInTheDocument()
    expect(screen.getByLabelText('Webhook URL')).toHaveValue('https://hooks.example.test/streamgate')
  })

  it('executes inbox bulk actions and webhook test against the official adapter paths', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>

    renderApp('/notifications', 'admin')

    expect(await screen.findByText('Centro de notificacoes')).toBeInTheDocument()

    fireEvent.click((await screen.findAllByRole('checkbox'))[0])
    fireEvent.click(screen.getByRole('button', { name: /Marcar visiveis como lidas/i }))
    fireEvent.click(screen.getByRole('button', { name: /Arquivar selecionadas/i }))
    fireEvent.click(screen.getByRole('button', { name: /Regras e canais/i }))
    fireEvent.click(screen.getByRole('button', { name: /Testar webhook/i }))

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([input, init]) => String(input).includes('/api/v1/notifications/mark-all-read') && String(init?.method).toUpperCase() === 'PATCH')).toBe(true)
      expect(fetchMock.mock.calls.some(([input, init]) => String(input).includes('/api/v1/notifications/bulk-archive') && String(init?.method).toUpperCase() === 'PATCH')).toBe(true)
      expect(fetchMock.mock.calls.some(([input, init]) => String(input).includes('/api/v1/notification-settings/webhook/test') && String(init?.method).toUpperCase() === 'POST')).toBe(true)
    })
  })

  it('protects operations wizard from operators', async () => {
    renderApp('/operations', 'operator')

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Revisar regras/i })).not.toBeInTheDocument()
    })
  })

  it('submits the admin retry wizard and renders the backend result state', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>

    renderApp('/operations', 'admin')

    expect(await screen.findByRole('button', { name: /Revisar regras/i })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Buscar ou colar alvo'), { target: { value: 'job_fixture_pending' } })
    fireEvent.click(screen.getByRole('button', { name: /Revisar regras/i }))
    fireEvent.click(screen.getByRole('button', { name: /Informar motivo/i }))
    fireEvent.click(screen.getByRole('button', { name: /Confirmar operacao/i }))

    expect(await screen.findByText(/Retry solicitado: retry_requested/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([input, init]) => String(input).includes('/api/v1/jobs/job_fixture_pending/retry') && String(init?.method).toUpperCase() === 'POST')).toBe(true)
    })
  })

  it('renders artifact history on job detail and requests signed download url', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null)
    renderApp('/jobs/job_fixture_pending', 'admin')

    expect(await screen.findByText('Artefatos finais')).toBeInTheDocument()
    expect(await screen.findByText('quality-report.json')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Download/i }))

    await waitFor(() => {
      expect(open).toHaveBeenCalledWith('https://signed.example.test/quality-report.json', '_blank', 'noopener,noreferrer')
    })

    open.mockRestore()
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
  return vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = String(init?.method ?? 'GET').toUpperCase()

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
      if (readRoleFromStoredSession() !== 'admin') {
        return Promise.resolve(jsonResponse(403, {
          error: {
            code: 'access_denied',
            message: 'Somente admins podem consultar DLQ.',
            request_id: 'req_dlq_denied',
            trace_id: 'trace_dlq_denied',
          },
        }))
      }

      return Promise.resolve(jsonResponse(200, dlqResponse()))
    }

    if (url.includes('/api/v1/quarantine')) {
      return Promise.resolve(jsonResponse(200, quarantineResponse()))
    }

    if (url.includes('/api/v1/audit')) {
      if (readRoleFromStoredSession() !== 'admin') {
        return Promise.resolve(jsonResponse(403, {
          error: {
            code: 'access_denied',
            message: 'Somente admins podem consultar auditoria.',
            request_id: 'req_audit_denied',
            trace_id: 'trace_audit_denied',
          },
        }))
      }

      return Promise.resolve(jsonResponse(200, auditResponse()))
    }

    if (url.includes('/api/v1/notification-settings/webhook/test')) {
      return Promise.resolve(jsonResponse(202, webhookDeliveryResponse()))
    }

    if (url.includes('/api/v1/notification-settings')) {
      return Promise.resolve(jsonResponse(200, notificationSettingsResponse()))
    }

    if (url.includes('/api/v1/notifications/mark-all-read')) {
      return Promise.resolve(jsonResponse(200, { data: { updated_count: 1 } }))
    }

    if (url.includes('/api/v1/notifications/bulk-archive')) {
      return Promise.resolve(jsonResponse(200, { data: { archived_count: 1, ids: ['notification_fixture_failed'] } }))
    }

    if (url.includes('/api/v1/notifications/')) {
      if (method === 'DELETE') {
        return Promise.resolve(jsonResponse(200, { data: { deleted: true, id: 'notification_fixture_failed' } }))
      }

      return Promise.resolve(jsonResponse(200, notificationSingleResponse(url)))
    }

    if (url.includes('/api/v1/notifications')) {
      return Promise.resolve(jsonResponse(200, notificationsResponse(url)))
    }

    if (url.includes('/api/v1/jobs/job_fixture_pending/artifacts/artifact_fixture_quality/download-url')) {
      return Promise.resolve(jsonResponse(200, artifactDownloadResponse()))
    }

    if (url.includes('/api/v1/jobs/job_fixture_pending/artifacts')) {
      return Promise.resolve(jsonResponse(200, artifactsResponse()))
    }

    if (url.includes('/api/v1/jobs/job_fixture_pending/retry')) {
      return Promise.resolve(jsonResponse(202, {
        data: {
          job_id: 'job_fixture_pending',
          status: 'retry_requested',
          attempt_id: 'attempt_fixture_retry',
          outbox_id: 'outbox_fixture_retry',
        },
      }))
    }

    if (url.includes('/api/v1/quarantine/quarantine_fixture_warning/resolve')) {
      return Promise.resolve(jsonResponse(200, {
        data: {
          id: 'quarantine_fixture_warning',
          job_id: 'job_fixture_pending',
          resolution_status: 'resolved',
          resolution_reason: 'Acao operacional revisada e aprovada.',
          resolved_by_id: 'user_fixture_admin',
          resolved_at: '2026-04-20T11:00:00Z',
        },
      }))
    }

    if (url.includes('/api/v1/quarantine/dlq/event_fixture_1/replay-requests')) {
      return Promise.resolve(jsonResponse(201, replayRequestResponse('requested')))
    }

    if (url.includes('/api/v1/dlq-replay-requests/') && url.endsWith('/approve')) {
      return Promise.resolve(jsonResponse(200, replayRequestResponse('approved')))
    }

    if (url.includes('/api/v1/dlq-replay-requests/') && url.endsWith('/execute')) {
      return Promise.resolve(jsonResponse(202, replayRequestResponse('executed')))
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

function notificationsResponse(url: string) {
  const archived = url.includes('status=archived')
  return {
    data: archived ? [] : [
      {
        id: 'notification_fixture_failed',
        event_name: 'job.failed',
        title: 'Falha no job',
        body: 'O job job_fixture_pending falhou e requer investigacao.',
        status: 'unread',
        read_at: null,
        expires_at: '2026-05-20T00:00:00Z',
        metadata: { job_id: 'job_fixture_pending' },
        trace_id: 'trace_fixture_1',
        created_at: '2026-04-20T10:00:00Z',
      },
    ],
    meta: { pagination: { page: 1, per_page: 50, total_count: archived ? 0 : 1, total_pages: archived ? 0 : 1 } },
  }
}

function notificationSingleResponse(url: string) {
  const status = url.includes('/archive')
    ? 'archived'
    : url.includes('/unarchive')
      ? 'read'
      : 'read'

  return {
    data: {
      id: 'notification_fixture_failed',
      event_name: 'job.failed',
      title: 'Falha no job',
      body: 'O job job_fixture_pending falhou e requer investigacao.',
      status,
      read_at: '2026-04-20T11:00:00Z',
      expires_at: '2026-05-20T00:00:00Z',
      metadata: { job_id: 'job_fixture_pending' },
      trace_id: 'trace_fixture_1',
      created_at: '2026-04-20T10:00:00Z',
    },
  }
}

function notificationSettingsResponse() {
  return {
    data: {
      id: 'notifset_fixture',
      user_id: 'user_fixture_admin',
      in_app_enabled: true,
      email_enabled: true,
      webhook_enabled: true,
      webhook_url: 'https://hooks.example.test/streamgate',
      webhook_secret: null,
      created_at: '2026-04-20T10:00:00Z',
      updated_at: '2026-04-20T10:00:00Z',
    },
  }
}

function webhookDeliveryResponse() {
  return {
    data: {
      id: 'delivery_fixture',
      notification_id: null,
      channel: 'webhook',
      event_name: 'notification.webhook_test',
      status: 'pending',
      attempts_count: 0,
      next_attempt_at: null,
      delivered_at: null,
      response_status: null,
      trace_id: 'trace_fixture_1',
      created_at: '2026-04-20T10:00:00Z',
      webhook_secret: null,
    },
  }
}

function artifactsResponse() {
  return {
    data: [
      {
        id: 'artifact_fixture_quality',
        job_id: 'job_fixture_pending',
        artifact_type: 'quality_report',
        status: 'available',
        filename: 'quality-report.json',
        content_type: 'application/json',
        byte_size: 512,
        checksum_sha256: 'f'.repeat(64),
        generated_at: '2026-04-20T10:00:00Z',
        expires_at: '2026-05-20T10:00:00Z',
        metadata: { rows: 12 },
        trace_id: 'trace_fixture_1',
        created_at: '2026-04-20T10:00:00Z',
        updated_at: '2026-04-20T10:00:00Z',
      },
    ],
  }
}

function artifactDownloadResponse() {
  return {
    data: {
      artifact_id: 'artifact_fixture_quality',
      download_url: 'https://signed.example.test/quality-report.json',
      expires_at: '2026-04-20T10:05:00Z',
    },
  }
}

function replayRequestResponse(status: 'requested' | 'approved' | 'executed') {
  return {
    data: {
      id: 'replay_fixture_1',
      message_id: 'event_fixture_1',
      status,
      trace_id: 'trace_fixture_1',
      request_id: 'req_fixture_1',
      expires_at: '2026-05-20T10:00:00Z',
      created_at: '2026-04-20T10:00:00Z',
      updated_at: '2026-04-20T10:00:00Z',
    },
  }
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
