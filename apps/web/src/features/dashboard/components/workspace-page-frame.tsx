import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { DashboardSurface } from '@/features/dashboard/components/dashboard-surface'
import type { WorkspaceRoute } from '@/features/dashboard/components/workspace-config'
import { useAuth } from '@/features/auth/auth-context'
import { showSingletonToast } from '@/lib/toast'

export function WorkspacePageFrame({
  pathname,
  eyebrow,
  title,
  children,
  primaryActionLabel = '+ Upload',
  secondaryActionLabel,
  alertStrip,
}: {
  pathname: WorkspaceRoute
  eyebrow: string
  title: string
  children: ReactNode
  primaryActionLabel?: string
  secondaryActionLabel?: string | null
  alertStrip?: ReactNode
}) {
  const navigate = useNavigate()
  const { session, logout } = useAuth()

  async function handleLogout() {
    await logout()
    showSingletonToast('info', 'Sessao encerrada. Voce voltou para a landpage.')
    navigate('/', { replace: true })
  }

  return (
    <main className="h-screen overflow-hidden bg-[#0a0a0a] text-foreground">
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
        alertStrip={alertStrip}
      >
        {children}
      </DashboardSurface>
    </main>
  )
}
