import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { createSessionPayload, storeSession } from '@/lib/auth'
import { AuthProvider } from '@/features/auth/auth-context'
import { ProtectedRoute } from '@/features/auth/protected-route'

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

  it('renders protected content when a remembered session exists', () => {
    storeSession(
      createSessionPayload({
        email: 'ana@empresa.com',
        name: 'Ana Costa',
        remember: true,
      }),
    )

    renderApp('/dashboard')

    expect(screen.getByText('Dashboard protegida')).toBeInTheDocument()
    expect(screen.queryByText('Tela de login')).not.toBeInTheDocument()
  })
})
