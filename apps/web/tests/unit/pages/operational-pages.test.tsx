import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { AuthProvider } from '@/features/auth/auth-context'
import { createStoredAuthSession, storeAuthSession } from '@/lib/auth'
import { AnalyticsPage } from '@/features/analytics/pages/AnalyticsPage'
import { QuarantinePage } from '@/features/operations/pages/QuarantinePage'

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

describe.skip('operational pages', () => {
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

  it('renders command center dashboard parity with honest backend-pending interactions', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:dashboard-export')
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    renderApp('/dashboard', 'admin')

    expect(await screen.findByText('Volume Processado - ultimas 24h')).toBeInTheDocument()
    expect(await screen.findByText('Pipeline de Jobs')).toBeInTheDocument()
    expect(await screen.findByText('Throughput - Heatmap')).toBeInTheDocument()
    expect((await screen.findAllByText('backend-pending')).length).toBeGreaterThan(0)
    expect(screen.getByRole('tab', { name: /Ativos \(1\)/i })).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('tab', { name: /Fila \(0\)/i }))
    expect(await screen.findByText('Nenhum job nesta aba para a janela atual.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Jobs hoje/i }))
    expect(await screen.findByText('Detalhe contextual')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Abrir rota especializada/i })).toHaveAttribute('href', '/analytics?preset=last_24h')

    fireEvent.click(screen.getByRole('button', { name: /Fechar painel/i }))
    fireEvent.change(screen.getByLabelText('Motivo do alerta'), {
      target: { value: 'Triagem operacional validada.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Revisar alerta/i }))
    fireEvent.click(screen.getByRole('button', { name: /Dispensar alerta/i }))
    expect(screen.queryByText(/Quarentena aberta/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/i }))
    fireEvent.click(screen.getByRole('button', { name: /Exportar JSON/i }))

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/v1/realtime/tickets'))).toBe(true)
      expect(fetchMock.mock.calls.some(([input, init]) => String(input).includes('/api/v1/alerts/dashboard-warning-open/review') && String(init?.method).toUpperCase() === 'POST')).toBe(true)
      expect(fetchMock.mock.calls.some(([input, init]) => String(input).includes('/api/v1/alerts/dashboard-warning-open/dismiss') && String(init?.method).toUpperCase() === 'POST')).toBe(true)
      expect(fetchMock.mock.calls.filter(([input, init]) => String(input).includes('/api/v1/analytics/dashboard/exports') && String(init?.method).toUpperCase() === 'POST')).toHaveLength(2)
    })
    expect(createObjectUrl).toHaveBeenCalledTimes(2)
    expect((await screen.findAllByText('Quarentena')).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: '+ Upload' })).toHaveAttribute('href', '/upload')
    expect(await screen.findByText('Fonte: postgres_derived')).toBeInTheDocument()
    expect(await screen.findByText(/Realtime:/i)).toBeInTheDocument()
    expect(await screen.findByText('Worker processed event_fixture_1 with status processed.')).toBeInTheDocument()
    expect(screen.queryByText('1.840.000')).not.toBeInTheDocument()

    createObjectUrl.mockRestore()
    revokeObjectUrl.mockRestore()
  }, 15000)

  it('renders ClickHouse as a dense warehouse dashboard without SQL console claims', async () => {
    renderApp('/clickhouse', 'admin')

    expect(await screen.findByText('Warehouse operacional')).toBeInTheDocument()
    expect(await screen.findByText('Fonte: clickhouse')).toBeInTheDocument()
    expect(await screen.findByText('1.200')).toBeInTheDocument()
    expect(await screen.findByText('external_link')).toBeInTheDocument()
    expect(screen.queryByText(/SQL/i)).not.toBeInTheDocument()
  })

  it('renders ETL Explorer with auto-selected recent job and real lineage', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>

    renderApp('/etl-explorer', 'admin')

    expect(await screen.findByText('Lineage real')).toBeInTheDocument()
    expect(await screen.findByText('job_fixture_pending')).toBeInTheDocument()
    expect(await screen.findByText('batch_fixture_first')).toBeInTheDocument()
    expect(await screen.findByText('quality-report.json')).toBeInTheDocument()

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/v1/analytics/lineage?job_id=job_fixture_pending'))).toBe(true)
    })
  })

  it('renders realtime-backed event log with copied operational context', async () => {
    renderApp('/events', 'admin')

    expect(await screen.findByText('Event Log Operacional')).toBeInTheDocument()
    expect(await screen.findByText('worker.heartbeat')).toBeInTheDocument()
    expect(await screen.findByText('Worker:worker-01')).toBeInTheDocument()
    expect(await screen.findByTitle('Copiar trace_id')).toHaveTextContent('trace_realtime')
  })

  it('keeps the session and lets operators read sanitized realtime event log', async () => {
    renderApp('/events', 'operator')

    expect(await screen.findByText('Event Log Operacional')).toBeInTheDocument()
    expect(await screen.findByText('worker.heartbeat')).toBeInTheDocument()
    expect(await screen.findByText('Worker:worker-01')).toBeInTheDocument()
    expect(await screen.findByText((_, node) => node?.tagName === 'PRE' && (node.textContent?.includes('[masked]') ?? false))).toBeInTheDocument()
    expect(screen.queryByText(/Permissao negada para esta superficie/i)).not.toBeInTheDocument()
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

  it('renders connector profile management only for admins in settings', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>

    const { unmount } = renderApp('/settings', 'operator')

    expect(await screen.findByText(/Conectores restritos a administradores/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Criar perfil/i })).not.toBeInTheDocument()

    unmount()
    renderApp('/settings', 'admin')

    expect(await screen.findByText('Perfis de conectores')).toBeInTheDocument()
    expect(await screen.findByText('finance-s3')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Nome do perfil'), { target: { value: 'http-prod' } })
    fireEvent.change(screen.getByLabelText('Tipo de conector'), { target: { value: 'http' } })
    fireEvent.change(screen.getByLabelText('URL base HTTP'), { target: { value: 'https://data.example.test/orders.ndjson' } })
    fireEvent.change(screen.getByLabelText('Header de autenticacao'), { target: { value: 'Authorization' } })
    fireEvent.change(screen.getByLabelText('Valor do header'), { target: { value: 'Bearer secret-token' } })
    fireEvent.click(screen.getByRole('button', { name: /Criar perfil/i }))

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([input, init]) => String(input).includes('/api/v1/connectors/profiles') && String(init?.method).toUpperCase() === 'POST')).toBe(true)
    })
    expect(screen.queryByText('Bearer secret-token')).not.toBeInTheDocument()
  })

  it('renders SaaS release readiness in settings only for admins without leaking secrets', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>
    const { unmount } = renderApp('/settings', 'operator')

    expect(await screen.findByText(/Conectores restritos a administradores/i)).toBeInTheDocument()
    expect(screen.queryByText(/SOC 2 Type I/i)).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/v1/saas/readiness'))).toBe(false)

    unmount()
    renderApp('/settings', 'admin')

    expect(await screen.findByText('Centro SaaS')).toBeInTheDocument()
    expect(await screen.findByText('SOC 2 Type I')).toBeInTheDocument()
    expect(await screen.findByText('AWS EKS')).toBeInTheDocument()
    expect(await screen.findByText('Google Workspace OIDC')).toBeInTheDocument()
    expect(await screen.findByText('Google Drive')).toBeInTheDocument()
    expect((await screen.findAllByText('OAuth delegated')).length).toBeGreaterThan(0)
    expect(screen.getByText('Sem billing nesta release')).toBeInTheDocument()

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/v1/saas/readiness'))).toBe(true)
    })
    expect(screen.queryByText(/refresh_token|client_secret|lease_token|x-worker-token/i)).not.toBeInTheDocument()
  })

  it('renders SaaS organization security and Google Drive controls for admins only', async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>
    const { unmount } = renderApp('/settings', 'operator')

    expect(await screen.findByText(/Conectores restritos a administradores/i)).toBeInTheDocument()
    expect(screen.queryByText('StreamGate Alpha')).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/v1/organization'))).toBe(false)
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/v1/connectors/google-drive'))).toBe(false)

    unmount()
    renderApp('/settings', 'admin')

    expect(await screen.findByText('Organizacao')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('StreamGate Alpha')).toBeInTheDocument()
    expect((await screen.findAllByText('admin@streamgate.local')).length).toBeGreaterThan(0)
    expect(await screen.findByText('ops@example.com')).toBeInTheDocument()
    expect(await screen.findByText('Seguranca e acesso')).toBeInTheDocument()
    expect(await screen.findByText('Google Drive delegated')).toBeInTheDocument()
    expect(await screen.findByText(/Drive restricted scope/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Nome da organizacao'), { target: { value: 'StreamGate Alpha Prime' } })
    fireEvent.change(screen.getByLabelText('Retencao em dias'), { target: { value: '180' } })
    fireEvent.click(screen.getByRole('button', { name: /Salvar organizacao/i }))

    fireEvent.change(screen.getByLabelText('Email do convite'), { target: { value: 'new-operator@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /Enviar convite/i }))

    fireEvent.click(screen.getByRole('button', { name: /Iniciar setup MFA/i }))

    fireEvent.change(screen.getByLabelText('Issuer OIDC'), { target: { value: 'https://accounts.google.com' } })
    fireEvent.change(screen.getByLabelText('Client ID OIDC'), { target: { value: 'client.apps.googleusercontent.com' } })
    fireEvent.change(screen.getByLabelText('Credencial OIDC'), { target: { value: 'oidc-client-credential' } })
    fireEvent.change(screen.getByLabelText('Dominio Google Workspace'), { target: { value: 'example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /Salvar OIDC/i }))

    fireEvent.click(screen.getByRole('button', { name: /Autorizar Google Drive/i }))

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([input, init]) => String(input).includes('/api/v1/organization') && String(init?.method).toUpperCase() === 'PATCH')).toBe(true)
      expect(fetchMock.mock.calls.some(([input, init]) => String(input).includes('/api/v1/organization/invites') && String(init?.method).toUpperCase() === 'POST')).toBe(true)
      expect(fetchMock.mock.calls.some(([input, init]) => String(input).includes('/api/v1/auth/mfa/setup') && String(init?.method).toUpperCase() === 'POST')).toBe(true)
      expect(fetchMock.mock.calls.some(([input, init]) => String(input).includes('/api/v1/auth/oidc/config') && String(init?.method).toUpperCase() === 'PATCH')).toBe(true)
      expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/v1/connectors/google-drive/authorize'))).toBe(true)
    })
    expect(screen.queryByText('oidc-client-credential')).not.toBeInTheDocument()
    expect(screen.queryByText(/refresh_token|client_secret|lease_token|x-worker-token/i)).not.toBeInTheDocument()
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

    if (url.includes('/api/v1/realtime/tickets')) {
      return Promise.resolve(jsonResponse(201, {
        data: {
          ticket: 'realtime-ticket-fixture',
          organization_id: 'org_fixture',
          role: readRoleFromStoredSession(),
          expires_at: '2099-04-24T14:01:00Z',
        },
      }))
    }

    if (url.includes('/api/v1/realtime/events')) {
      return Promise.resolve(jsonResponse(200, {
        data: [
          {
            id: 'realtime_fixture_1',
            event_type: 'worker.heartbeat',
            organization_id: 'org_fixture',
            actor_id: null,
            resource_type: 'Worker',
            resource_id: 'worker-01',
            severity: 'info',
            payload: { worker_id: 'worker-01', token: '[masked]' },
            occurred_at: '2026-04-24T14:00:00Z',
            expires_at: '2026-05-01T14:00:00Z',
            trace_id: 'trace_realtime',
            request_id: null,
          },
        ],
      }))
    }

    if (url.includes('/api/v1/analytics/dashboard/exports')) {
      const body = JSON.parse(String(init?.body ?? '{}')) as { export?: { format?: string; kind?: string } }
      const format = body.export?.format ?? 'csv'
      const kind = body.export?.kind ?? 'snapshot'
      return Promise.resolve(jsonResponse(201, {
        data: {
          id: `export_${kind}_${format}`,
          filename: `streamgate-dashboard-${kind}.${format}`,
          content_type: format === 'json' ? 'application/json' : 'text/csv',
          content: format === 'json' ? '[{"label":"jobs_total","value":12}]' : 'label,value\njobs_total,12\n',
          checksum_sha256: 'e'.repeat(64),
          byte_size: 24,
          generated_at: '2026-04-24T14:00:00Z',
          expires_at: '2026-05-24T14:00:00Z',
          trace_id: 'trace_export',
        },
      }))
    }

    if (url.includes('/api/v1/organization/invites') && method === 'POST') {
      return Promise.resolve(jsonResponse(201, {
        data: {
          id: 'invite_new_operator',
          organization_id: 'org_fixture_alpha',
          email: 'new-operator@example.com',
          role: 'operator',
          status: 'pending',
          expires_at: '2026-05-13T12:00:00Z',
          invited_by_id: 'user_fixture_admin',
          accepted_by_id: null,
          accepted_at: null,
          created_at: '2026-05-06T12:00:00Z',
          updated_at: '2026-05-06T12:00:00Z',
        },
      }))
    }

    if (url.includes('/api/v1/organization/members/') && method === 'PATCH') {
      return Promise.resolve(jsonResponse(200, {
        data: {
          id: 'mem_operator',
          organization_id: 'org_fixture_alpha',
          user_id: 'user_fixture_operator',
          email: 'operator@streamgate.local',
          full_name: 'Operator StreamGate',
          role: 'operator',
          status: 'active',
          joined_at: '2026-04-01T12:00:00Z',
        },
      }))
    }

    if (url.includes('/api/v1/organization/members') && method === 'GET') {
      return Promise.resolve(jsonResponse(200, { data: organizationPayload().members }))
    }

    if (url.includes('/api/v1/organization') && method === 'PATCH') {
      return Promise.resolve(jsonResponse(200, {
        data: {
          ...organizationPayload(),
          organization: {
            ...organizationPayload().organization,
            name: 'StreamGate Alpha Prime',
            retention_days: 180,
          },
        },
      }))
    }

    if (url.includes('/api/v1/organization') && method === 'GET') {
      return Promise.resolve(jsonResponse(200, { data: organizationPayload() }))
    }

    if (url.includes('/api/v1/auth/mfa/setup') && method === 'POST') {
      return Promise.resolve(jsonResponse(201, {
        data: {
          factor_id: 'mfa_fixture',
          secret: 'BASE32SECRET',
          provisioning_uri: 'otpauth://totp/StreamGate:admin@streamgate.local',
          status: 'pending',
        },
      }))
    }

    if (url.includes('/api/v1/auth/oidc/config') && method === 'PATCH') {
      return Promise.resolve(jsonResponse(200, {
        data: {
          id: 'oidc_fixture',
          organization_id: 'org_fixture_alpha',
          provider: 'google_workspace',
          issuer: 'https://accounts.google.com',
          client_id: 'client.apps.googleusercontent.com',
          hosted_domain: 'example.com',
          scopes: ['openid', 'email', 'profile'],
          status: 'active',
        },
      }))
    }

    if (url.includes('/api/v1/connectors/google-drive/authorize')) {
      return Promise.resolve(jsonResponse(200, {
        data: {
          authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth?scope=drive',
          state: 'oauth_state_fixture',
          expires_at: '2026-05-06T12:05:00Z',
          scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/drive'],
        },
      }))
    }

    if (url.includes('/api/v1/connectors/google-drive/items')) {
      return Promise.resolve(jsonResponse(200, {
        data: [
          { id: 'drive_file_orders', name: 'orders.csv', mime_type: 'text/csv', kind: 'file' },
          { id: 'drive_folder_finance', name: 'finance-folder', mime_type: 'application/vnd.google-apps.folder', kind: 'folder' },
        ],
      }))
    }

    if (url.includes('/api/v1/connectors/google-drive/revoke') && method === 'DELETE') {
      return Promise.resolve(jsonResponse(200, {
        data: {
          id: 'drive_connection_fixture',
          organization_id: 'org_fixture_alpha',
          user_id: 'user_fixture_admin',
          provider: 'google_drive',
          status: 'revoked',
          scopes: ['https://www.googleapis.com/auth/drive'],
          revoked_at: '2026-05-06T12:00:00Z',
        },
      }))
    }

    if (url.includes('/api/v1/saas/readiness')) {
      return Promise.resolve(jsonResponse(200, {
        data: {
          generated_at: '2026-05-05T12:00:00Z',
          organization: {
            id: 'org_fixture_alpha',
            members: { active: 2, invited: 0, suspended: 0 },
          },
          access: { role: 'admin', admin: true },
          identity: {
            mfa: { mode: 'totp', status: 'required_for_release', recovery_codes: 'required_for_rollout' },
            sso: { protocol: 'oidc', validated_provider: 'google_workspace', status: 'external_credentials_required' },
            saml: { enabled: false, status: 'out_of_scope' },
          },
          billing: { status: 'out_of_scope', reason: 'Sem billing nesta release' },
          quotas: {
            status: 'required_for_release',
            defaults: { upload_gb_per_month: 500, connector_runs_per_day: 1000, retention_days: 180 },
          },
          connectors: {
            configured_count: 1,
            active_profiles: 1,
            supported: ['s3', 'http', 'google_drive', 'oauth_delegated'],
            google_drive: { status: 'external_credentials_required', acquisition_modes: ['file', 'folder'] },
            oauth_delegated: { status: 'external_credentials_required', provider: 'google_workspace' },
            clear_lease_credentials_circulate: false,
          },
          security: {
            controls: ['malware_scanning', 'parser_fuzzing', 'ssrf_egress_policy', 'organization_quotas', 'credential_scanning'],
            sensitive_surface: {
              signed_urls_in_ui: false,
              raw_payloads_in_events: false,
              connector_credentials_in_events: false,
            },
          },
          infrastructure: {
            runtime: 'aws_eks',
            ingress_tls: true,
            credential_store: 'aws_secrets_manager_external_secrets_irsa',
            data_services: ['rds_postgres', 's3', 'elasticache_redis', 'amazon_mq', 'clickhouse_cloud'],
          },
          observability: {
            stack: 'open_source',
            telemetry: 'opentelemetry',
            metrics: 'prometheus',
            logs: 'loki',
            dashboards: 'grafana',
            alerts: 'alertmanager',
          },
          compliance: {
            target: 'soc2_type_i',
            status: 'design_evidence_ready',
            evidence_sections: ['access_control', 'change_management', 'vulnerability_management'],
          },
          external_blockers: ['aws_account', 'google_oauth_client', 'clickhouse_cloud_workspace', 'soc2_auditor', 'production_dns_tls'],
        },
      }))
    }

    if (url.includes('/api/v1/alerts/') && url.endsWith('/review')) {
      return Promise.resolve(jsonResponse(200, {
        data: {
          id: 'dashboard-warning-open',
          status: 'reviewed',
          reviewed_at: '2026-04-24T14:00:00Z',
        },
      }))
    }

    if (url.includes('/api/v1/alerts/') && url.endsWith('/dismiss')) {
      return Promise.resolve(jsonResponse(200, {
        data: {
          id: 'dashboard-warning-open',
          status: 'dismissed',
          dismissed_at: '2026-04-24T14:01:00Z',
        },
      }))
    }

    if (url.includes('/api/v1/connectors/profiles') && url.endsWith('/test')) {
      return Promise.resolve(jsonResponse(200, {
        data: { id: 'conn_s3_fixture', status: 'configured', kind: 's3' },
      }))
    }

    if (url.includes('/api/v1/connectors/profiles') && method === 'POST') {
      return Promise.resolve(jsonResponse(201, {
        data: {
          id: 'conn_http_fixture',
          organization_id: 'org_fixture',
          kind: 'http',
          name: 'http-prod',
          status: 'active',
          settings: { url: '[masked]' },
          created_by_id: 'user_fixture_admin',
          trace_id: 'trace_connector',
          created_at: '2026-04-24T14:00:00Z',
          updated_at: '2026-04-24T14:00:00Z',
        },
      }))
    }

    if (url.includes('/api/v1/connectors/profiles') && method === 'GET') {
      if (readRoleFromStoredSession() !== 'admin') {
        return Promise.resolve(jsonResponse(403, {
          error: {
            code: 'access_denied',
            message: 'Acesso negado para conectores.',
            request_id: 'req_connector_denied',
            trace_id: 'trace_connector_denied',
          },
        }))
      }

      return Promise.resolve(jsonResponse(200, {
        data: [
          {
            id: 'conn_s3_fixture',
            organization_id: 'org_fixture',
            kind: 's3',
            name: 'finance-s3',
            status: 'active',
            settings: { bucket: '[masked]', region: 'us-east-1' },
            created_by_id: 'user_fixture_admin',
            trace_id: 'trace_connector',
            created_at: '2026-04-24T14:00:00Z',
            updated_at: '2026-04-24T14:00:00Z',
          },
        ],
      }))
    }

    if (url.includes('/api/v1/analytics/dashboard')) {
      return Promise.resolve(jsonResponse(200, analyticsDashboardResponse()))
    }

    if (url.includes('/api/v1/analytics/warehouse')) {
      return Promise.resolve(jsonResponse(200, analyticsWarehouseResponse()))
    }

    if (url.includes('/api/v1/analytics/lineage')) {
      return Promise.resolve(jsonResponse(200, analyticsLineageResponse()))
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

function organizationPayload() {
  return {
    organization: {
      id: 'org_fixture_alpha',
      slug: 'streamgate-alpha',
      name: 'StreamGate Alpha',
      status: 'active',
      quotas: {
        max_file_bytes: 10737418240,
        monthly_upload_bytes: 1099511627776,
        connector_runs_daily: 1000,
      },
      retention_days: 90,
      compliance_profile: { target: 'soc2_type_i' },
      created_at: '2026-04-01T12:00:00Z',
      updated_at: '2026-05-06T12:00:00Z',
    },
    members: [
      {
        id: 'mem_admin',
        organization_id: 'org_fixture_alpha',
        user_id: 'user_fixture_admin',
        email: 'admin@streamgate.local',
        full_name: 'Admin StreamGate',
        role: 'admin',
        status: 'active',
        joined_at: '2026-04-01T12:00:00Z',
      },
      {
        id: 'mem_operator',
        organization_id: 'org_fixture_alpha',
        user_id: 'user_fixture_operator',
        email: 'operator@streamgate.local',
        full_name: 'Operator StreamGate',
        role: 'operator',
        status: 'active',
        joined_at: '2026-04-02T12:00:00Z',
      },
    ],
    invites: [
      {
        id: 'invite_ops',
        organization_id: 'org_fixture_alpha',
        email: 'ops@example.com',
        role: 'operator',
        status: 'pending',
        expires_at: '2026-05-13T12:00:00Z',
        invited_by_id: 'user_fixture_admin',
        accepted_by_id: null,
        accepted_at: null,
        created_at: '2026-05-06T12:00:00Z',
        updated_at: '2026-05-06T12:00:00Z',
      },
    ],
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

function analyticsDashboardResponse() {
  return {
    data: {
      generated_at: '2026-04-24T14:00:00Z',
      source: 'postgres_derived',
      window: { from: '2026-04-23T14:00:00Z', to: '2026-04-24T14:00:00Z', preset: 'last_24h', timezone: 'UTC' },
      sections: {
        queue: {
          status: 'derived',
          generated_at: '2026-04-24T14:00:00Z',
          data: { processed: 3, retried: 1, moved_to_dlq: 0 },
          empty_state: null,
        },
        workers: {
          status: 'derived',
          generated_at: '2026-04-24T14:00:00Z',
          data: { processed: 2, failed_terminal: 0, average_latency_ms: 120 },
          empty_state: null,
        },
        throughput: {
          status: 'derived',
          generated_at: '2026-04-24T14:00:00Z',
          data: { jobs_total: 12, uploads_total: 12, completed: 8, failed: 2, quarantined: 1 },
          empty_state: null,
        },
        formats: {
          status: 'derived',
          generated_at: '2026-04-24T14:00:00Z',
          data: [{ content_type: 'text/csv', count: 12 }],
          empty_state: null,
        },
        warnings: {
          status: 'derived',
          generated_at: '2026-04-24T14:00:00Z',
          data: { open: 1, failed: 2, resolved: 0 },
          empty_state: null,
        },
        event_log: {
          status: 'derived',
          generated_at: '2026-04-24T14:00:00Z',
          data: [
            {
              timestamp: '2026-04-24T13:59:40Z',
              type: 'worker_metric',
              severity: 'info',
              job_id: 'job_fixture_pending',
              upload_id: 'upload_fixture_registered',
              status: 'processed',
              message: 'Worker processed event_fixture_1 with status processed.',
            },
          ],
          empty_state: null,
        },
      },
      dependencies: {
        broker: { status: 'healthy' },
        warehouse: { status: 'degraded', source: 'postgres_derived', fallback_reason: 'clickhouse_unavailable' },
      },
      slo: {
        slo_target_seconds: 300,
        last_event_at: '2026-04-24T13:59:40Z',
        lag_seconds: 20,
        stale: false,
        p95_ms: 240,
        error_budget_percent: 99.9,
      },
    },
  }
}

function analyticsWarehouseResponse() {
  return {
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
        jobs_total: 12,
        uploads_total: 12,
        records_total: 1200,
        valid_records: 1188,
        invalid_records: 12,
        by_status: { completed: 11, quarantined_with_warnings: 1 },
        by_source: { upload: 10, external_link: 2 },
      },
    },
  }
}

function analyticsLineageResponse() {
  return {
    data: {
      job: jobsResponse().data[0],
      upload: uploadsResponse().data[0],
      acquisition: null,
      batches: [
        {
          id: 'batch_fixture_first',
          job_id: 'job_fixture_pending',
          batch_number: 1,
          status: 'completed',
          input_rows: 12,
          valid_rows: 11,
          invalid_rows: 1,
          trace_id: 'trace_fixture_1',
          created_at: '2026-04-20T10:00:00Z',
          updated_at: '2026-04-20T10:01:00Z',
        },
      ],
      attempts: [
        {
          id: 'attempt_fixture_1',
          attempt_number: 1,
          operation: 'process_upload',
          status: 'completed',
          retryable: false,
          error_code: null,
          started_at: '2026-04-20T10:00:00Z',
          finished_at: '2026-04-20T10:01:00Z',
          trace_id: 'trace_fixture_1',
        },
      ],
      quarantine: quarantineResponse().data,
      artifacts: artifactsResponse().data,
      warnings: [],
      audit_refs: [
        {
          id: 'audit_fixture_registered',
          action: 'upload.registered',
          auditable_type: 'Upload',
          auditable_id: 'upload_fixture_registered',
          trace_id: 'trace_fixture_1',
          occurred_at: '2026-04-20T10:00:00Z',
        },
      ],
    },
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
