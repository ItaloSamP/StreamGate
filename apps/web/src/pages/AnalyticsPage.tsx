import { WorkspaceModule } from '@/components/app/workspace-module'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'

export function AnalyticsPage() {
  return (
    <WorkspacePageFrame pathname="/analytics" eyebrow="Leitura analitica" title="Analytics Workspace" primaryActionLabel="Comparar periodos">
      <WorkspaceModule
        title="Analytics Workspace"
        description="A camada analitica ganha rota propria desde a Sprint 1 para evitar que o dashboard operacional vire mistura de KPI em tempo real com leitura agregada."
        highlights={[
          { label: 'Origem futura', value: 'ClickHouse', hint: 'Leitura derivada do pipeline operacional' },
          { label: 'Navegacao', value: 'modulo dedicado', hint: 'Sem reescrever o shell depois' },
          { label: 'Foco', value: 'trend + aggregation', hint: 'Metricas historicas e recortes temporais' },
        ]}
        checkpoints={[
          'Separacao explicita entre workspace operacional e analitico.',
          'Area pronta para filtros por periodo, origem e pipeline.',
          'Slots reservados para metricas, graficos e breakdowns futuros.',
        ]}
      />
    </WorkspacePageFrame>
  )
}
