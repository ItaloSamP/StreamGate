import { WorkspaceModule } from '@/components/app/workspace-module'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'

export function SettingsPage() {
  return (
    <WorkspacePageFrame pathname="/settings" eyebrow="Workspace e integracoes" title="Configuracoes" primaryActionLabel="Salvar preferencias">
      <WorkspaceModule
        title="Configuracoes"
        description="A Sprint 1 reserva a superficie de configuracoes para ambiente, integracoes e comportamento do cliente HTTP sem inventar um shell paralelo mais tarde."
        highlights={[
          { label: 'Backend target', value: 'API base URL', hint: 'Centralizado no adapter oficial' },
          { label: 'Session layer', value: 'mock today', hint: 'Pronta para auth real na Sprint 2' },
          { label: 'Workspace policy', value: 'single shell', hint: 'Toda tela protegida herda a mesma familia visual' },
        ]}
        checkpoints={[
          'Espaco reservado para preferencias de sessao e ambiente.',
          'Integracoes futuras podem crescer aqui sem cruzar com auditoria.',
          'Cliente HTTP e configuracao operacional agora tem casa oficial na UI.',
        ]}
      />
    </WorkspacePageFrame>
  )
}
