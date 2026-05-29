import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/features/auth/auth-context'
import { createStoredAuthSession, storeAuthSession } from '@/lib/auth'
import { JobsPage } from '@/pages/JobsPage'

const originalFetch = global.fetch

function renderJobsPage(initialEntry = '/jobs') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/jobs" element={<JobsPage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe.skip('JobsPage', () => {
  beforeEach(() => {
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
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('reads status and page from URL and queries backend with the same filters', async () => {
    const calls: string[] = []

    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(jsonResponse(200, {
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
              trace_id: 'trace_auth_1',
            },
          },
        }))
      }

      if (url.includes('/api/v1/jobs?')) {
        calls.push(url)
        return Promise.resolve(jsonResponse(200, {
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
              page: 3,
              per_page: 20,
              total_count: 1,
              total_pages: 1,
            },
            filters: {},
          },
        }))
      }

      return Promise.resolve(jsonResponse(404, {
        error: {
          code: 'not_found',
          message: 'not mapped',
          request_id: 'req_not_mapped',
          trace_id: 'trace_not_mapped',
        },
      }))
    }) as typeof fetch

    renderJobsPage('/jobs?status=failed&page=3')

    await waitFor(() => {
      expect(calls[0]).toContain('/api/v1/jobs?status=failed&page=3&per_page=20')
    })

    global.fetch = originalFetch
  })

  it('renders empty state when no jobs are returned', async () => {
    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(authMeResponse())
      }

      if (url.includes('/api/v1/jobs?')) {
        return Promise.resolve(jsonResponse(200, {
          data: [],
          meta: {
            pagination: {
              page: 1,
              per_page: 20,
              total_count: 0,
              total_pages: 0,
            },
            filters: {},
          },
        }))
      }

      return Promise.resolve(authMeResponse())
    }) as typeof fetch

    renderJobsPage('/jobs')

    expect(await screen.findByText('Nenhum job encontrado para este filtro. Ajuste o status ou aguarde novos uploads.')).toBeInTheDocument()

    global.fetch = originalFetch
  })

  it('shows retry action when list request fails', async () => {
    let jobsCalls = 0

    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(authMeResponse())
      }

      if (url.includes('/api/v1/jobs?')) {
        jobsCalls += 1

        if (jobsCalls === 1) {
          return Promise.resolve(jsonResponse(422, {
            error: {
              code: 'validation_failed',
              message: 'status invalido',
              request_id: 'req_jobs_1',
              trace_id: 'trace_jobs_1',
            },
          }))
        }

        return Promise.resolve(jsonResponse(200, {
          data: [],
          meta: {
            pagination: {
              page: 1,
              per_page: 20,
              total_count: 0,
              total_pages: 0,
            },
            filters: {},
          },
        }))
      }

      return Promise.resolve(authMeResponse())
    }) as typeof fetch

    renderJobsPage('/jobs')

    expect(await screen.findByText('status invalido (validation_failed)')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await waitFor(() => {
      expect(jobsCalls).toBeGreaterThanOrEqual(2)
    })

    global.fetch = originalFetch
  })

  it('resets page to 1 when status filter changes', async () => {
    const calls: string[] = []

    global.fetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve(authMeResponse())
      }

      if (url.includes('/api/v1/jobs?')) {
        calls.push(url)
        return Promise.resolve(jsonResponse(200, {
          data: [],
          meta: {
            pagination: {
              page: 1,
              per_page: 20,
              total_count: 0,
              total_pages: 0,
            },
            filters: {},
          },
        }))
      }

      return Promise.resolve(authMeResponse())
    }) as typeof fetch

    renderJobsPage('/jobs?status=failed&page=4')

    await waitFor(() => {
      expect(calls[0]).toContain('/api/v1/jobs?status=failed&page=4&per_page=20')
    })

    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'completed' },
    })

    await waitFor(() => {
      const lastCall = calls[calls.length - 1] ?? ''
      expect(lastCall).toContain('/api/v1/jobs?status=completed&page=1&per_page=20')
    })

    global.fetch = originalFetch
  })
})

function authMeResponse() {
  return jsonResponse(200, {
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
        trace_id: 'trace_auth_1',
      },
    },
  })
}

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
  } as Response
}

