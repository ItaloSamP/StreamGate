import { WorkspaceModule } from '@/components/app/workspace-module'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'
import { useAuth } from '@/features/auth/auth-context'
import { ConnectorProfilesPanel } from '@/features/settings/components/ConnectorProfilesPanel'
import { GoogleDrivePanel } from '@/features/settings/components/GoogleDrivePanel'
import { OrganizationAdminPanel } from '@/features/settings/components/OrganizationAdminPanel'
import { SaasReadinessPanel } from '@/features/settings/components/SaasReadinessPanel'
import { SecurityAdminPanel } from '@/features/settings/components/SecurityAdminPanel'

export function SettingsPage() {
  const { session } = useAuth()
  const isAdmin = session?.user.role === 'admin'

  return (
    <WorkspacePageFrame pathname="/settings" eyebrow="Workspace e integracoes" title="Configuracoes" primaryActionLabel="Salvar preferencias">
      <WorkspaceModule
        title="Configuracoes"
        description="A fundacao de autenticacao conecta autenticacao real e consolida esta superficie para variaveis de ambiente, sessao e comportamento do cliente HTTP."
        highlights={[
          { label: 'Backend target', value: 'API base URL', hint: 'Centralizado no adapter oficial' },
          { label: 'Session layer', value: 'real auth', hint: 'Login, logout, me e reset conectados ao backend' },
          { label: 'Workspace policy', value: 'single shell', hint: 'Toda tela protegida herda a mesma familia visual' },
        ]}
        checkpoints={[
          'Sessao real persistida em storage conforme opcao de lembrar login.',
          'Integracoes futuras podem crescer aqui sem cruzar com auditoria.',
          'Cliente HTTP e configuracao operacional agora tem casa oficial na UI.',
        ]}
      >
        {isAdmin ? (
          <>
            <OrganizationAdminPanel />
            <SecurityAdminPanel />
            <GoogleDrivePanel />
            <SaasReadinessPanel />
            <ConnectorProfilesPanel />
          </>
        ) : <OperatorConnectorNotice />}
      </WorkspaceModule>
    </WorkspacePageFrame>
  )
}

function OperatorConnectorNotice() {
  return (
    <section className="dash-panel dash-module-card">
      <div className="dash-panel-head">
        <div>
          <div className="dash-panel-title">Conectores restritos a administradores</div>
          <div className="dash-module-copy">
            Operadores acompanham ingestao, jobs e eventos no proprio escopo, mas nao gerenciam organizacao, membros, SSO, quotas, compliance, conectores sensiveis ou leases.
          </div>
        </div>
        <span className="dash-panel-tag">RBAC</span>
      </div>
    </section>
  )
}
