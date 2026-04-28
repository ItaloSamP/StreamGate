import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createStoredAuthSession, storeAuthSession } from '@/lib/auth'
import { AuthProvider } from '@/features/auth/auth-context'
import { ProtectedRoute } from '@/features/auth/protected-route'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
})

describe('ProtectedRoute', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  function renderApp(initialEntry: string) {
    return render(
      <AuthProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/login" element={<div>Tela de login</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Dashboard protegida</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )
  }

  it('redirects unauthenticated users to login', () => {
    renderApp('/dashboard')

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard protegida')).not.toBeInTheDocument()
  })

  it('renders protected content when a remembered session exists', async () => {
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

    global.fetch = vi.fn().mockResolvedValue({
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
    }) as typeof fetch

    renderApp('/dashboard')

    expect(await screen.findByText('Dashboard protegida')).toBeInTheDocument()
    expect(screen.queryByText('Tela de login')).not.toBeInTheDocument()
  })
})
