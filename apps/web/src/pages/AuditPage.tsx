import { WorkspaceModule } from '@/components/app/workspace-module'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'

export function AuditPage() {
  return (
    <WorkspacePageFrame pathname="/audit" eyebrow="Governanca e trilha" title="Auditoria" primaryActionLabel="Filtrar atores">
      <WorkspaceModule
        title="Auditoria"
        description="A trilha de auditoria ganha area dedicada para consolidar quem fez o que, em qual recurso e sob qual contexto de request e trace."
        highlights={[
          { label: 'Escopo', value: 'actor + resource', hint: 'Usuario, acao, recurso e metadados' },
          { label: 'Uso futuro', value: 'investigation trail', hint: 'Base para replay e suporte operacional' },
          { label: 'Risco tratado', value: 'no hidden actions', hint: 'A governanca ja entra na navegacao oficial' },
        ]}
        checkpoints={[
          'Tabela auditavel com filtros por ator, recurso e tempo prevista.',
          'Contexto de request_id e trace_id ja cabe no desenho da rota.',
          'A rota evita espalhar informacao sensivel pelo dashboard geral.',
        ]}
      />
    </WorkspacePageFrame>
  )
}
