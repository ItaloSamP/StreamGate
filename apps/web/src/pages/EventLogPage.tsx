import { WorkspaceModule } from '@/components/app/workspace-module'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'

export function EventLogPage() {
  return (
    <WorkspacePageFrame pathname="/events" eyebrow="Eventos do sistema" title="Event Log" primaryActionLabel="Filtrar eventos">
      <WorkspaceModule
        title="Event Log"
        description="A timeline de eventos fica em rota propria para suportar filtragem, correlacao por trace e inspecao de contratos sem poluir a home do workspace."
        highlights={[
          { label: 'Visao futura', value: 'stream timeline', hint: 'Eventos ordenados por tempo e origem' },
          { label: 'Correlacao', value: 'trace aware', hint: 'Base para cruzar API, worker e auditoria' },
          { label: 'Contratos', value: 'event schemas', hint: 'Convergencia com packages/contracts' },
        ]}
        checkpoints={[
          'Area pronta para filtros por event_name, trace_id e job_id.',
          'Separacao entre mensagem curta e payload detalhado prevista.',
          'Layout preserva densidade operacional sem virar mosaico de cards.',
        ]}
      />
    </WorkspacePageFrame>
  )
}
