import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../features/auth/auth-context'
import { LandingPage } from './LandingPage'
import { LoginPage } from './LoginPage'

describe('entry surfaces', () => {
  it('keeps the landing page focused on the product value and dashboard access', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    expect(screen.getAllByText('Acesse sua dashboard').length).toBeGreaterThan(0)
    expect(
      screen.getByText('Visualize, controle e opere seus pipelines de dados.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Monitore ingestao, jobs, filas, quarentena e trilhas de auditoria em um unico lugar.',
      ),
    ).toBeInTheDocument()
  })

  it('keeps the login page focused on access without extra informational panels', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.getByText('Entrar no workspace.')).toBeInTheDocument()
    expect(screen.queryByText('Janela de acesso')).not.toBeInTheDocument()
    expect(screen.queryByText('Checklist rapido')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Redefinir senha' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Criar conta' })).toBeInTheDocument()
  })
})
