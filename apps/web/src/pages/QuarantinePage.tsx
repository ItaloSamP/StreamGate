import { WorkspaceModule } from '@/components/app/workspace-module'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'

export function QuarantinePage() {
  return (
    <WorkspacePageFrame pathname="/quarantine" eyebrow="Qualidade e triagem" title="Quarentena" primaryActionLabel="Abrir triagem">
      <WorkspaceModule
        title="Quarentena"
        description="A triagem de registros invalidados passa a ter superficie propria para nao competir com a leitura macro do dashboard."
        highlights={[
          { label: 'Pendencias abertas', value: '7 registros', hint: 'Badge ja refletido na navegacao do workspace' },
          { label: 'Fluxo alvo', value: 'triage first', hint: 'Separacao entre causa, payload e acao' },
          { label: 'Saidas futuras', value: 'resolve / replay', hint: 'Conectado as sprints de operacao assistida' },
        ]}
        checkpoints={[
          'Tabela de registros, motivo e severidade prevista no layout.',
          'Contexto para owner, lote, upload e job ja cabe na superficie.',
          'Espaco reservado para feedback de revisao e reprocessamento futuro.',
        ]}
      />
    </WorkspacePageFrame>
  )
}
