import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import App from '@/App'
import { createSessionPayload, storeSession } from '@/lib/auth'
import { AuthProvider } from '@/features/auth/auth-context'

function renderProtectedEntry(initialEntry: string) {
  window.localStorage.clear()
  window.sessionStorage.clear()
  storeSession(
    createSessionPayload({
      email: 'ana@empresa.com',
      name: 'Ana Costa',
      remember: true,
    }),
  )

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <App />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('workspace routes', () => {
  it('renders jobs route inside the protected workspace shell', () => {
    renderProtectedEntry('/jobs')

    expect(screen.getByText('Jobs Operacionais')).toBeInTheDocument()
    expect(screen.getAllByText('Jobs Operacionais').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /Quarentena/i })).toBeInTheDocument()
  })

  it('renders analytics route with dedicated title', () => {
    renderProtectedEntry('/analytics')

    expect(screen.getByText('Analytics Workspace')).toBeInTheDocument()
    expect(screen.getByText('Separacao explicita entre workspace operacional e analitico.')).toBeInTheDocument()
  })
})
