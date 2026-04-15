import { useEffect, useMemo, useState } from 'react'

import { OperationalStateBlock, OperationalToolbar } from '@/components/app/operational-readout'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'
import { useOperationalQueryState } from '@/hooks/use-operational-query-state'
import { buildCsv, buildOperationalQuery, downloadCsv, formatNumber, humanizeOperationalError } from '@/lib/operational-utils'
import { streamgateApi, type AnalyticsSnapshot } from '@/lib/streamgate-api'

type AnalyticsViewState = {
  status: 'loading' | 'success' | 'empty' | 'error'
  snapshot: AnalyticsSnapshot | null
  lastUpdatedAt: Date | null
  errorMessage: string | null
}

const INITIAL_STATE: AnalyticsViewState = {
  status: 'loading',
  snapshot: null,
  lastUpdatedAt: null,
  errorMessage: null,
}

export function AnalyticsPage() {
  const { query, queryKey } = useOperationalQueryState({ defaultSortBy: 'count' })
  const [reloadToken, setReloadToken] = useState(0)
  const [viewState, setViewState] = useState<AnalyticsViewState>(INITIAL_STATE)

  useEffect(() => {
    let active = true

    async function loadAnalytics() {
      setViewState((current) => ({ ...current, status: 'loading', errorMessage: null }))

      try {
        const response = await streamgateApi.getAnalytics(buildOperationalQuery(query))
        if (!active) return

        setViewState({
          status: response.data ? 'success' : 'empty',
          snapshot: response.data,
          lastUpdatedAt: new Date(),
          errorMessage: null,
        })
      } catch (error) {
        if (!active) return

        setViewState((current) => ({
          ...current,
          status: 'error',
          errorMessage: humanizeOperationalError(error, 'Nao foi possivel carregar analytics.'),
          lastUpdatedAt: new Date(),
        }))
      }
    }

    loadAnalytics()

    return () => {
      active = false
    }
  }, [query, queryKey, reloadToken])

  const kpis = viewState.snapshot?.kpis
  const metricRows = useMemo(() => {
    if (!kpis) return []

    return [
      { label: 'Uploads totais', value: kpis.uploads_total },
      { label: 'Jobs totais', value: kpis.jobs_total },
      { label: 'Processando', value: kpis.jobs_processing },
      { label: 'Concluidos', value: kpis.jobs_completed },
      { label: 'Falhos', value: kpis.jobs_failed },
      { label: 'Quarentena', value: kpis.jobs_quarantined },
      { label: 'Registros quarentena', value: kpis.quarantine_records_total },
      { label: 'Eventos auditados', value: kpis.audit_events_total },
    ]
  }, [kpis])

  function exportCsv() {
    const csv = buildCsv(metricRows, ['label', 'value'])
    downloadCsv('streamgate-analytics.csv', csv)
  }

  return (
    <WorkspacePageFrame pathname="/analytics" eyebrow="Leitura analitica" title="Analytics Workspace" primaryActionLabel="Recarregar">
      <div className="dash-content dash-content--module">
        <div className="dash-module-shell">
          <section className="dash-panel dash-module-card">
            <div className="dash-panel-head">
              <div>
                <div className="dash-panel-title">Command Center Analytics</div>
                <div className="dash-module-copy">
                  KPIs e breakdowns reais do backend Sprint 4 com janela por URL, default last_7d e leitura read-only.
                </div>
              </div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">{query.preset}</span>
                <span className="dash-panel-tag">{query.timezone}</span>
              </div>
            </div>

            <OperationalToolbar
              lastUpdatedAt={viewState.lastUpdatedAt}
              onRefresh={() => setReloadToken((current) => current + 1)}
              onExport={exportCsv}
              exportDisabled={metricRows.length === 0}
            />
          </section>

          <section className="dash-panel dash-module-card">
            <OperationalStateBlock
              status={viewState.status}
              errorMessage={viewState.errorMessage}
              emptyMessage="Nenhum KPI retornado para a janela atual."
            >
              <div className="dash-module-grid">
                {metricRows.map((metric) => (
                  <div key={metric.label} className="dash-module-card">
                    <div className="dash-module-label">{metric.label}</div>
                    <div className="dash-module-value">{formatNumber(metric.value)}</div>
                    <div className="dash-module-hint">janela atual</div>
                  </div>
                ))}
              </div>
            </OperationalStateBlock>
          </section>

          {viewState.snapshot ? (
            <section className="dash-panel dash-module-card">
              <div className="dash-panel-head">
                <div className="dash-panel-title">Breakdowns</div>
                <div className="dash-panel-right"><span className="dash-panel-tag">status + actor + source</span></div>
              </div>
              <div className="dash-table-scroll">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Dimensao</th>
                      <th>Valor</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewState.snapshot.breakdowns.status.map((row) => (
                      <tr key={`status-${row.status}`}>
                        <td className="dim">status</td>
                        <td className="name">{row.status}</td>
                        <td>{row.count}</td>
                      </tr>
                    ))}
                    {viewState.snapshot.breakdowns.actor.map((row) => (
                      <tr key={`actor-${row.actor_id}`}>
                        <td className="dim">actor</td>
                        <td className="name">{row.actor_id}</td>
                        <td>{row.count}</td>
                      </tr>
                    ))}
                    {viewState.snapshot.breakdowns.source.map((row) => (
                      <tr key={`source-${row.source}`}>
                        <td className="dim">source</td>
                        <td className="name">{row.source}</td>
                        <td>{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </WorkspacePageFrame>
  )
}
