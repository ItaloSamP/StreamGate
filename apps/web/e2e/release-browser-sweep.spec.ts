import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { readFileSync } from 'node:fs'

const criticalRoutes = [
  { path: '/dashboard', title: 'Dashboard' },
  { path: '/upload', title: 'Upload Center' },
  { path: '/settings', title: 'Configuracoes' },
  { path: '/clickhouse', title: 'ClickHouse' },
  { path: '/etl-explorer', title: 'ETL Explorer' },
  { path: '/analytics', title: 'Analytics Workspace' },
  { path: '/events', title: 'Event Log' },
  { path: '/quarantine', title: 'Quarentena' },
  { path: '/audit', title: 'Auditoria' },
]

const seededAdminEmail = 'admin@streamgate.local'
const seededOperatorEmail = 'operator@streamgate.local'
const seededOperatorPasswords = Array.from(new Set([
  process.env.SEED_OPERATOR_PASSWORD,
  readRootDotEnvValue('SEED_OPERATOR_PASSWORD'),
  'TrocaNdo123!',
  'ChangeMe123!',
].filter((value): value is string => Boolean(value && value.trim()))))
const seededAdminPasswords = Array.from(new Set([
  process.env.SEED_ADMIN_PASSWORD,
  readRootDotEnvValue('SEED_ADMIN_PASSWORD'),
  'TrocaNdo123!',
  ...seededOperatorPasswords,
  'ChangeMe123!',
].filter((value): value is string => Boolean(value && value.trim()))))

test.describe('release browser sweep', () => {
  test('admin can navigate every release-critical browser route without inert controls', async ({ page }, testInfo) => {
    await loginAsAdmin(page)
    await mockDlqRead(page)
    const errors = collectConsoleErrors(page)

    for (const route of criticalRoutes) {
      await page.goto(route.path)
      await expect(page).toHaveURL(new RegExp(`${route.path.replace('/', '\\/')}$|${route.path.replace('/', '\\/')}\\?`), { timeout: 45_000 })
      await expect(page.locator('.dash-topbar-title')).toContainText(route.title, { timeout: 45_000 })
      await expectNoInertControls(page, testInfo, route.path)
    }

    expect(errors()).toEqual([])
  })

  test('operator role keeps critical operational routes but is denied from audit-only surfaces', async ({ page }, testInfo) => {
    await loginAsOperator(page)

    await expect(page.getByRole('link', { name: 'Auditoria' })).toHaveCount(0)

    await page.goto('/audit')
    await expect(page.locator('.dash-topbar-title')).toContainText('Auditoria')
    await expect(page.getByText(/Permissao negada para esta superficie/i)).toBeVisible()

    const errors = collectConsoleErrors(page)

    for (const route of criticalRoutes.filter((entry) => entry.path !== '/audit')) {
      await page.goto(route.path)
      await expect(page.locator('.dash-topbar-title')).toContainText(route.title, { timeout: 45_000 })
      await expectNoInertControls(page, testInfo, route.path)
    }

    await page.goto('/events')
    await expect(page.getByText('Event Log Operacional')).toBeVisible()
    await expect(page.getByText(/Permissao negada para esta superficie/i)).toHaveCount(0)

    await page.goto('/settings')
    await expect(page.getByText(/Conectores restritos a administradores/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Criar perfil/i })).toHaveCount(0)

    await page.goto('/upload')
    await expect(page.getByRole('button', { name: 'Conector' })).toHaveCount(0)

    await page.goto('/quarantine')
    await expect(page.getByText('DLQ read-only')).toHaveCount(0)

    expect(errors()).toEqual([])
  })

  test('empty and degraded release states are visible and honest', async ({ page }, testInfo) => {
    await loginAsAdmin(page)

    await page.route('**/api/v1/analytics?**', async (route) => {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: null }) })
    })
    await page.route('**/api/v1/analytics/warehouse?**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            source: 'postgres_derived',
            generated_at: '2026-04-24T14:00:00Z',
            last_event_at: null,
            lag_seconds: null,
            stale: true,
            slo_target_seconds: 300,
            p95_ms: 0,
            error_budget_percent: 0,
            dependency_status: { clickhouse: 'degraded', postgres: 'healthy' },
            fallback_reason: 'clickhouse_unavailable',
            aggregates: {
              jobs_total: 0,
              uploads_total: 0,
              records_total: 0,
              valid_records: 0,
              invalid_records: 0,
              by_status: {},
              by_source: {},
            },
          },
        }),
      })
    })
    await page.route('**/api/v1/quarantine?**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          meta: { pagination: { page: 1, per_page: 20, total_count: 0, total_pages: 0 }, filters: {} },
        }),
      })
    })
    await mockDlqRead(page)
    await page.route('**/api/v1/realtime/events?**', async (route) => {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: [] }) })
    })

    await page.goto('/analytics')
    await expect(page.getByText('Nenhum KPI retornado para a janela atual.')).toBeVisible()
    await expect(page.getByRole('button', { name: /Exportar CSV/i })).toBeDisabled()
    await expectNoInertControls(page, testInfo, '/analytics empty')

    await page.goto('/clickhouse')
    await expect(page.getByText('Fonte: postgres_derived')).toBeVisible()
    await expect(page.getByText('clickhouse_unavailable').first()).toBeVisible()

    await page.goto('/quarantine')
    await expect(page.getByText('Nenhum registro em quarentena para os filtros atuais.')).toBeVisible()
    await expect(page.getByRole('button', { name: /Exportar CSV/i })).toBeDisabled()

    await page.goto('/events')
    await expect(page.getByText('Nenhum evento retornado para esta janela.')).toBeVisible()
  })
})

async function loginAsOperator(page: Page) {
  await login(page, seededOperatorEmail, seededOperatorPasswords)
}

async function loginAsAdmin(page: Page) {
  await login(page, seededAdminEmail, seededAdminPasswords)
}

async function login(page: Page, email: string, passwords: string[]) {
  await mockAuthEndpoints(page, email)

  for (const password of passwords) {
    await page.goto('/login')
    await page.getByTestId('login-email').fill(email)
    await page.getByTestId('login-password').fill(password)
    await page.getByRole('checkbox', { name: /Relembrar login/i }).check()
    await page.getByTestId('login-submit').click()

    try {
      await expect(page).toHaveURL(/\/dashboard(?:$|\?)/, { timeout: 12_000 })
      await expect(page.locator('.dash-topbar-title')).toContainText('Dashboard')
      return
    } catch {
      // Try the next known local password.
    }
  }

  throw new Error(`Nao foi possivel autenticar ${email} para o sweep de release.`)
}

async function mockAuthEndpoints(page: Page, email: string) {
  const role = email.includes('admin') ? 'admin' : 'operator'
  
  await page.route('**/api/v1/**', async (route) => {
    const url = route.request().url()
    
    if (url.includes('/auth/login') || url.includes('/auth/session') || url.includes('/auth/me')) {
      await route.fulfill({
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          data: {
            user: { id: `user_${role}`, email, full_name: 'Sweep User', role, status: 'active' },
            session: { id: 'sess_1', token_type: 'Bearer', access_token: 'fake-token' }
          }
        })
      })
      return
    }
    
    if (url.includes('/saas/readiness')) {
      await route.fulfill({
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          data: {
            compliance: { target: 'soc2_type_i', status: 'mock', evidence_sections: [] },
            infrastructure: { runtime: 'aws_eks', ingress_tls: true },
            observability: { stack: 'mock' },
            identity: { sso: { validated_provider: 'google_workspace', protocol: 'saml' }, mfa: { mode: 'optional' }, saml: { status: 'mock' } },
            billing: { reason: 'mock', status: 'mock' },
            quotas: { status: 'mock' },
            connectors: { configured_count: 0, supported: [] },
            external_blockers: [],
            access: { admin: role === 'admin' }
          }
        })
      })
      return
    }

    if (url.includes('/api/v1/organization/members')) {
      await route.fulfill({
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ data: [] })
      })
      return
    }

    if (url.includes('/organization')) {
      await route.fulfill({
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          data: { 
            organization: { id: 'org_1', name: 'Sweep Org', settings: {}, quotas: {}, compliance_profile: { target: 'soc2_type_i' } },
            members: [],
            invites: []
          } 
        })
      })
      return
    }


    if (url.includes('/analytics/dashboard')) {
      await route.fulfill({
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          data: {
            generated_at: new Date().toISOString(),
            source: 'mock',
            window: { preset: 'last_24h' },
            sections: {
              throughput: { status: 'mock', data: { jobs_total: 0, uploads_total: 0, completed: 0, failed: 0, quarantined: 0 } },
              queue: { status: 'mock', data: { processed: 0, retried: 0, moved_to_dlq: 0 } },
              workers: { status: 'mock', data: { processed: 0, failed_terminal: 0, average_latency_ms: 0 } },
              warnings: { status: 'mock', data: { open: 0, failed: 0, resolved: 0 } }
            }
          }
        })
      })
      return
    }

    if (url.includes('/analytics') && !url.includes('/dashboard')) {
      await route.fulfill({
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          data: {
            kpis: { uploads_total: 0, jobs_total: 0, jobs_processing: 0, jobs_completed: 0, jobs_failed: 0, jobs_quarantined: 0, quarantine_records_total: 0, audit_events_total: 0 },
            breakdowns: { status: [], actor: [], source: [] }
          }
        })
      })
      return
    }

    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
      return
    }
    
    // Fallback for any other API calls to prevent ERR_CONNECTION_REFUSED
    await route.fulfill({
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ data: [] })
    })
  })
}

function collectConsoleErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })
  page.on('pageerror', (error) => {
    errors.push(error.message)
  })

  return () => errors
}

async function mockDlqRead(page: Page) {
  await page.route('**/api/v1/quarantine/dlq**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            payload: { event_id: 'dlq_release_fixture', trace_id: 'trace_release_sweep' },
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
      }),
    })
  })
}

async function expectNoInertControls(page: Page, testInfo: TestInfo, routeName: string) {
  const inert = await page.locator('button:visible, a:visible').evaluateAll((elements) => {
    return elements.flatMap((element) => {
      const label = [
        element.getAttribute('aria-label'),
        element.getAttribute('title'),
        element.textContent,
      ].join(' ').trim()
      const tagName = element.tagName.toLowerCase()
      const disabled = element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true'
      const href = element.getAttribute('href')

      if (!label) return [`${tagName} without accessible text`]
      if (tagName === 'a' && (!href || href === '#')) return [`link "${label}" without destination`]
      if (tagName === 'button' && !disabled && element.getAttribute('type') === null) return [`button "${label}" without explicit type`]

      return []
    })
  })

  await testInfo.attach(`controls-${routeName.replace(/[^a-z0-9]+/gi, '-')}`, {
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify({ inert }, null, 2)),
  })
  expect(inert).toEqual([])
}

function readRootDotEnvValue(key: string) {
  try {
    const dotenv = readFileSync(new URL('../../../.env', import.meta.url), 'utf8')
    const line = dotenv
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .reverse()
      .find((entry) => entry.startsWith(`${key}=`))

    if (!line) {
      return null
    }

    return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '')
  } catch {
    return null
  }
}
