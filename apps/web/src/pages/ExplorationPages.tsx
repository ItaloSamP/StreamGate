import { Link } from 'react-router-dom'

import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'

function PlaceholderMetric({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="dash-kpi">
      <div className="dash-kpi-label">{label}</div>
      <div className="dash-kpi-value">{value}</div>
      <div className="dash-kpi-foot">
        <span className="dash-kpi-sub">{hint}</span>
      </div>
    </div>
  )
}

function ScaffoldPage({
  pathname,
  eyebrow,
  title,
  tone,
  description,
  bullets,
}: {
  pathname: '/clickhouse' | '/etl-explorer'
  eyebrow: string
  title: string
  tone: string
  description: string
  bullets: string[]
}) {
  return (
    <WorkspacePageFrame pathname={pathname} eyebrow={eyebrow} title={title} secondaryActionLabel={null}>
      <div className="dash-content">
        <section className="dash-panel">
          <div className="dash-panel-head">
            <div>
              <div className="dash-panel-title">{title}</div>
              <div className="dash-module-copy">{description}</div>
            </div>
            <div className="dash-panel-right">
              <span className="dash-panel-tag">{tone}</span>
            </div>
          </div>
          <div className="dash-grid-4">
            <PlaceholderMetric label="Blocos previstos" value="04" hint="surface scaffold" />
            <PlaceholderMetric label="Conectores" value="02" hint="discovery only" />
            <PlaceholderMetric label="Queries fixas" value="06" hint="atalhos prontos" />
            <PlaceholderMetric label="Estado" value="UI" hint="aguardando wiring" />
          </div>
        </section>

        <div className="dash-grid-2">
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Estrutura pronta</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">visual scaffold</span>
              </div>
            </div>
            <ol className="dash-module-list">
              {bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ol>
          </section>

          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Proximos encaixes</div>
              <div className="dash-panel-right">
                <Link className="dash-panel-tag" to="/dashboard">
                  voltar ao command center
                </Link>
              </div>
            </div>
            <div className="dash-module-note">
              A superficie ja segue a linguagem final do workspace. O passo seguinte e plugar queries reais,
              filtros e drilldowns sem refazer o shell.
            </div>
            <div className="dash-module-pill-row">
              <span className="dash-module-pill">layout travado</span>
              <span className="dash-module-pill">navegacao pronta</span>
              <span className="dash-module-pill">dados entram depois</span>
            </div>
          </section>
        </div>
      </div>
    </WorkspacePageFrame>
  )
}

export function ClickHousePage() {
  return (
    <ScaffoldPage
      pathname="/clickhouse"
      eyebrow="Exploracao analitica"
      title="ClickHouse"
      tone="warehouse"
      description="Surface reservada para leituras operacionais de alto volume, consultas prontas e recortes por throughput."
      bullets={[
        'cards de throughput, volume e falhas ja preparados para queries reais',
        'atalhos para tabelas de batches, eventos e agregados por janela',
        'composicao final alinhada ao command center v3 do prototipo',
      ]}
    />
  )
}

export function EtlExplorerPage() {
  return (
    <ScaffoldPage
      pathname="/etl-explorer"
      eyebrow="Fluxos e lineage"
      title="ETL Explorer"
      tone="pipeline"
      description="Surface reservada para lineage, batches, transformacoes e leitura de etapas do runtime sem quebrar o shell final."
      bullets={[
        'timeline de etapas e batches pronta para receber contratos reais',
        'blocos de lineage e diagnostico ja posicionados para drilldown posterior',
        'espaco preparado para filtros, dependencias e contexto tecnico do pipeline',
      ]}
    />
  )
}
