import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { DashboardSurface } from '@/components/app/dashboard-surface'
import type { WorkspaceRoute } from '@/components/app/workspace-config'
import { useAuth } from '@/features/auth/auth-context'
import { showSingletonToast } from '@/lib/toast'

export function WorkspacePageFrame({
  pathname,
  eyebrow,
  title,
  children,
  primaryActionLabel = '+ Upload',
  secondaryActionLabel = 'Exportar',
}: {
  pathname: WorkspaceRoute
  eyebrow: string
  title: string
  children: ReactNode
  primaryActionLabel?: string
  secondaryActionLabel?: string
}) {
  const navigate = useNavigate()
  const { session, logout } = useAuth()

  async function handleLogout() {
    await logout()
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
            profileName={session?.user.full_name ?? 'Operator'}
            email={session?.user.email ?? 'operator@streamgate.local'}
            role={session?.user.role ?? 'operator'}
            onLogout={handleLogout}
            pathname={pathname}
            eyebrow={eyebrow}
            title={title}
            primaryActionLabel={primaryActionLabel}
            secondaryActionLabel={secondaryActionLabel}
            enableOperationalBadges={pathname === '/dashboard'}
          >
            {children}
          </DashboardSurface>
        </section>
      </div>
    </main>
  )
}
