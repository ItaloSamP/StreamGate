import { WorkspaceModule } from '@/components/app/workspace-module'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'

export function SettingsPage() {
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
      />
    </WorkspacePageFrame>
  )
}
