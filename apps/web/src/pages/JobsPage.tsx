import { WorkspaceModule } from '@/components/app/workspace-module'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'
import { jobUiStates } from '@/components/app/workspace-config'

export function JobsPage() {
  return (
    <WorkspacePageFrame pathname="/jobs" eyebrow="Execucao e throughput" title="Jobs Operacionais" primaryActionLabel="Filtrar jobs">
      <WorkspaceModule
        title="Jobs Operacionais"
        description="A rota de jobs nasce com linguagem de monitoramento e estados oficiais do backend, preparando filtros, leitura operacional e polling futuro."
        highlights={[
          { label: 'Estados oficiais', value: String(jobUiStates.length), hint: 'Pendente, processando, concluido, falhou e quarentena' },
          { label: 'Leitura alvo', value: 'operational table', hint: 'Filtros, paginacao e progress bars previstos' },
          { label: 'Acao futura', value: 'retry + inspect', hint: 'A superficie ja separa leitura e intervencao' },
        ]}
        checkpoints={jobUiStates.map((state) => `${state.label}: ${state.intent}`)}
      />
    </WorkspacePageFrame>
  )
}
