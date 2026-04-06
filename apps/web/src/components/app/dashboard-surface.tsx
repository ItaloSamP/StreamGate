import { useState, type ReactNode } from 'react'
import { LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import '@/components/app/dashboard-surface.css'

import { StreamGateMark } from '@/components/app/brand'
import { dashboardNavIcon } from '@/components/app/dashboard-data'
import { workspaceNavGroups, workspaceTopChips } from '@/components/app/workspace-config'
import { WorkspaceOverview } from '@/components/app/workspace-overview'

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function SidebarUser({
  locked,
  initials,
  profileName,
  role,
  onLogout,
}: {
  locked: boolean
  initials: string
  profileName: string
  role: string
  onLogout?: () => void
}) {
  const [open, setOpen] = useState(false)

  if (locked || !onLogout) {
    return (
      <div className="dash-user-row">
        <div className="dash-avatar">{initials}</div>
        <div>
          <div className="dash-user-name">{profileName}</div>
          <div className="dash-user-role">{role}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dash-user-menu">
      <button type="button" className="dash-user-row dash-user-row--button" onClick={() => setOpen((value) => !value)}>
        <div className="dash-avatar">{initials}</div>
        <div className="dash-user-copy">
          <div className="dash-user-name">{profileName}</div>
          <div className="dash-user-role">{role}</div>
        </div>
        <span className="dash-user-caret">{open ? '-' : '+'}</span>
      </button>

      {open ? (
        <div className="dash-user-popover">
          <div className="dash-user-popover-head">
            <div className="dash-user-name">{profileName}</div>
            <div className="dash-user-role">{role}</div>
          </div>
          <button type="button" className="dash-user-popover-action" onClick={onLogout}>
            <span>Sair da plataforma</span>
            <LogOut size={14} />
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function DashboardSurface({
  locked = false,
  profileName = 'Ana Lima',
  email = 'ana.lima@streamgate.io',
  onLogout,
  eyebrow = 'Visao geral do sistema',
  title = 'Dashboard Operacional',
  pathname = '/dashboard',
  primaryActionLabel = '+ Upload',
  secondaryActionLabel = 'Exportar',
  children,
}: {
  locked?: boolean
  profileName?: string
  email?: string
  onLogout?: () => void
  eyebrow?: string
  title?: string
  pathname?: string
  primaryActionLabel?: string
  secondaryActionLabel?: string
  children?: ReactNode
}) {
  const initials = getInitials(profileName)
  const role = locked ? 'Data Engineer' : email
  const content = children ?? <WorkspaceOverview />

  return (
    <div className={`dash-frame ${locked ? 'dash-frame--locked' : ''}`}>
      <div className={`dash-root ${locked ? 'dash-root--locked' : ''}`}>
        <aside className="dash-sidebar">
          <div className="dash-logo-area">
            <StreamGateMark />
            <div>
              <div className="dash-logo-main">
                Stream<em>Gate</em>
              </div>
              <div className="dash-logo-sub">data pipeline workspace</div>
            </div>
          </div>

          <nav className="dash-nav">
            {workspaceNavGroups.map((group) => (
              <div key={group.label} className="dash-nav-group">
                <div className="dash-nav-group-label">{group.label}</div>
                {group.items.map((item) => {
                  const isActive = item.match === 'exact' ? pathname === item.href : pathname.startsWith(item.href)
                  const itemBody = (
                    <>
                      <div className="dash-nav-icon">{dashboardNavIcon(item.icon)}</div>
                      {item.label}
                      {item.badge ? (
                        <span className={`dash-nav-badge ${item.badge.tone ?? ''}`}>{item.badge.text}</span>
                      ) : null}
                    </>
                  )

                  if (locked) {
                    return (
                      <div key={item.label} className={`dash-nav-item ${isActive ? 'active' : ''}`}>
                        {itemBody}
                      </div>
                    )
                  }

                  return (
                    <NavLink key={item.label} to={item.href} className={`dash-nav-item ${isActive ? 'active' : ''}`}>
                      {itemBody}
                    </NavLink>
                  )
                })}
              </div>
            ))}
          </nav>

          <div className="dash-sidebar-footer">
            <div className="dash-gauges">
              <div>
                <div className="dash-gauge-row">
                  <span>MinIO Storage</span>
                  <span className="warn">72%</span>
                </div>
                <div className="dash-gauge-bar">
                  <div className="dash-gauge-fill" style={{ width: '72%', background: 'var(--signal-yellow)', opacity: '.55' }} />
                </div>
              </div>
              <div>
                <div className="dash-gauge-row">
                  <span>RabbitMQ</span>
                  <span>3 msgs</span>
                </div>
                <div className="dash-gauge-bar">
                  <div className="dash-gauge-fill" style={{ width: '18%', background: 'var(--signal-blue)', opacity: '.5' }} />
                </div>
              </div>
            </div>

            <SidebarUser locked={locked} initials={initials} profileName={profileName} role={role} onLogout={onLogout} />
          </div>
        </aside>

        <div className="dash-main">
          <header className="dash-topbar">
            <div className="dash-topbar-left">
              <div className="dash-topbar-eyebrow">{eyebrow}</div>
              <div className="dash-topbar-title">{title}</div>
            </div>
            <div className="dash-topbar-divider" />
            {workspaceTopChips.map((chip) => (
              <div key={chip.label} className="dash-topbar-chip">
                <div className={`dash-live-dot ${chip.tone === 'warn' ? 'dash-live-dot--warn' : 'dash-live-dot--ok'}`} />
                {chip.label}
              </div>
            ))}
            <div className="dash-topbar-spacer" />
            <div className="dash-topbar-actions">
              <button type="button" className="dash-btn">{secondaryActionLabel}</button>
              <button type="button" className="dash-btn dash-btn--primary">{primaryActionLabel}</button>
            </div>
          </header>

          <div className="dash-alert-strip">
            <span className="dash-alert-icon">Atencao</span>
            <span><strong>2 jobs falharam</strong> nas ultimas 2h. A navegacao desta sprint ja reserva as superficies de retry, quarentena e auditoria.</span>
            <span className="dash-alert-link">Revisar</span>
            <span className="dash-alert-close">Fechar</span>
          </div>

          {content}
        </div>
      </div>

      {locked ? (
        <div className="dash-locked-overlay">
          <div className="dash-locked-chip">Preview do workspace liberado apos login</div>
        </div>
      ) : null}
    </div>
  )
}
