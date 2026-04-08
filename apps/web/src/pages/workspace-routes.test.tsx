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

describe('workspace routes', () => {
  it('renders jobs route inside the protected workspace shell', async () => {
    renderProtectedEntry('/jobs')

    expect((await screen.findAllByText('Leitura real de jobs')).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /Quarentena/i })).toBeInTheDocument()
  })

  it('renders analytics route with dedicated title', async () => {
    renderProtectedEntry('/analytics')

    expect((await screen.findAllByText('Analytics Workspace')).length).toBeGreaterThan(0)
    expect(screen.getByText('Separacao explicita entre workspace operacional e analitico.')).toBeInTheDocument()
  })
})

