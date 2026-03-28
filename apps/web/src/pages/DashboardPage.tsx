import { useNavigate } from 'react-router-dom'

import { DashboardSurface } from '@/components/app/dashboard-surface'
import { useAuth } from '@/features/auth/auth-context'
import { showSingletonToast } from '@/lib/toast'

export function DashboardPage() {
  const navigate = useNavigate()
  const { session, logout } = useAuth()

  function handleLogout() {
    logout()
    showSingletonToast('info', 'Sessao encerrada. Voce voltou para a landpage.')
    navigate('/', { replace: true })
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(circle_at_top_left,rgba(77,157,224,0.18),transparent_32%),radial-gradient(circle_at_65%_10%,rgba(60,207,207,0.12),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-40 panel-grid" />

        <section className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <DashboardSurface
            profileName={session?.name ?? 'Ana Lima'}
            email={session?.email ?? 'ana.lima@streamgate.io'}
            onLogout={handleLogout}
          />
        </section>
      </div>
    </main>
  )
}
