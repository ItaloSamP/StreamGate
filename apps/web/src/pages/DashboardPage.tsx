import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'
import { formatDateTime, formatNumber, humanizeOperationalError } from '@/lib/operational-utils'
import {
  streamgateApi,
  type AnalyticsDashboardEvent,
  type AnalyticsDashboardSnapshot,
  type JobSummary,
  type UploadSummary,
} from '@/lib/streamgate-api'

type DashboardViewState = {
  status: 'loading' | 'success' | 'empty' | 'error'
  dashboard: AnalyticsDashboardSnapshot | null
  jobs: JobSummary[]
  uploads: UploadSummary[]
  lastUpdatedAt: Date | null
  errorMessage: string | null
}

const INITIAL_STATE: DashboardViewState = {
  status: 'loading',
  dashboard: null,
  jobs: [],
  uploads: [],
  lastUpdatedAt: null,
  errorMessage: null,
}

export function DashboardPage() {
  const [viewState, setViewState] = useState<DashboardViewState>(INITIAL_STATE)

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setViewState((current) => ({ ...current, status: 'loading', errorMessage: null }))

      try {
        const dashboardPromise = streamgateApi.getAnalyticsDashboard({ preset: 'last_24h', timezone: 'UTC' })
        const jobsPromise = streamgateApi.listJobs({ page: 1, per_page: 7 })
        const uploadsPromise = streamgateApi.listUploads({ page: 1, per_page: 6 })

        const [dashboardResponse, jobsResponse, uploadsResponse] = await Promise.all([
          dashboardPromise,
          jobsPromise,
          uploadsPromise,
        ])

        if (!active) return

        const jobs = Array.isArray(jobsResponse.data) ? jobsResponse.data : []
        const uploads = Array.isArray(uploadsResponse.data) ? uploadsResponse.data : []

        setViewState({
          status: dashboardResponse.data ? 'success' : 'empty',
          dashboard: dashboardResponse.data,
          jobs,
          uploads,
          lastUpdatedAt: new Date(),
          errorMessage: null,
        })
      } catch (error) {
        if (!active) return

        setViewState((current) => ({
          ...current,
          status: 'error',
          errorMessage: humanizeOperationalError(error, 'Nao foi possivel carregar a dashboard da Sprint 6.'),
          lastUpdatedAt: new Date(),
        }))
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [])

  const model = useMemo(() => buildDashboardModel(viewState), [viewState])

  return (
    <WorkspacePageFrame pathname="/dashboard" eyebrow="Visao geral do sistema" title="Dashboard" secondaryActionLabel="Exportar">
      <div className="dash-content">
        <div className="dash-kpi-strip">
          {model.kpis.map((item) => (
            <div key={item.label} className={`dash-kpi ${item.className}`}>
              <div className="dash-kpi-label">{item.label}</div>
              <div className="dash-kpi-value">{item.value}</div>
              <div className="dash-kpi-foot">
                <span className="dash-kpi-sub">{item.sub}</span>
                <span className={`dash-kpi-tag dash-kpi-tag--${item.tagTone}`}>{item.tag}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="dash-grid-2">
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div>
                <div className="dash-panel-title">Volume Processado · ultimas 24h</div>
                <div className="dash-module-copy">
                  Fonte primaria: analytics/dashboard, sem series artificiais quando o backend nao entrega serie temporal.
                </div>
              </div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">Fonte: {model.source}</span>
                <span className="dash-panel-tag">{model.snapshotStatus}</span>
              </div>
            </div>

            <div className="dash-module-grid">
              {model.metrics.map((metric) => (
                <div key={metric.label} className="dash-module-card">
                  <div className="dash-module-label">{metric.label}</div>
                  <div className="dash-module-value">{metric.value}</div>
                  <div className="dash-module-hint">{metric.hint}</div>
                </div>
              ))}
            </div>

            <div className="dash-table-scroll">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Dependencia</th>
                    <th>Status</th>
                    <th>Fonte</th>
                    <th>Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {model.dependencies.map((dependency) => (
                    <tr key={dependency.name}>
                      <td className="name">{dependency.name}</td>
                      <td><span className={dependency.statusClass}>{dependency.status}</span></td>
                      <td className="dim">{dependency.source}</td>
                      <td className="dim">{dependency.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Pipeline de Jobs</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">{model.queueStatus}</span>
                <Link className="dash-panel-tag" to="/upload">Upload Center</Link>
              </div>
            </div>

            <div className="dash-module-grid">
              <div className="dash-module-card">
                <div className="dash-module-label">Processados</div>
                <div className="dash-module-value">{model.queue.processed}</div>
                <div className="dash-module-hint">eventos confirmados</div>
              </div>
              <div className="dash-module-card">
                <div className="dash-module-label">Retentativas</div>
                <div className="dash-module-value">{model.queue.retried}</div>
                <div className="dash-module-hint">retry no worker</div>
              </div>
              <div className="dash-module-card">
                <div className="dash-module-label">DLQ</div>
                <div className="dash-module-value">{model.queue.movedToDlq}</div>
                <div className="dash-module-hint">movidos para fila morta</div>
              </div>
            </div>

            {model.jobs.length > 0 ? (
              <div className="dash-table-scroll">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Job</th>
                      <th>Upload</th>
                      <th>Origem</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {model.jobs.map((job) => (
                      <tr key={job.id}>
                        <td><Link className="name" to={`/jobs/${job.id}`}>{job.id}</Link></td>
                        <td className="dim">{job.upload_id}</td>
                        <td className="dim">{job.source_type}</td>
                        <td><span className={statusPillClass(job.status)}>{job.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="dash-module-note">{model.jobsEmptyState}</div>
            )}
          </section>
        </div>

        <div className="dash-grid-4">
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">SLO</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">{model.slo.stale ? 'stale' : 'fresh'}</span>
              </div>
            </div>
            <MetricList rows={[
              ['Meta', `${model.slo.targetSeconds}s`],
              ['Lag', model.slo.lagSeconds],
              ['P95', `${model.slo.p95Ms} ms`],
              ['Error budget', `${model.slo.errorBudgetPercent}%`],
            ]} />
          </section>

          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Formatos</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">{model.formatsStatus}</span>
              </div>
            </div>
            <MetricList rows={model.formats} emptyState={model.formatsEmptyState} />
          </section>

          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Quarentena</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">{model.warningsStatus}</span>
              </div>
            </div>
            <MetricList rows={[
              ['Abertos', model.warnings.open],
              ['Falhos', model.warnings.failed],
              ['Resolvidos', model.warnings.resolved],
            ]} />
          </section>

          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Uploads recentes</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">{model.uploads.length} itens</span>
              </div>
            </div>
            <MetricList rows={model.uploads.map((upload) => [upload.filename, upload.status])} emptyState="Nenhum upload recente nesta janela." />
          </section>
        </div>

        <div className="dash-grid-2">
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Event Log</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">{model.eventLogStatus}</span>
              </div>
            </div>
            {model.eventLog.length > 0 ? (
              <div className="dash-event-log">
                {model.eventLog.map((event) => (
                  <div key={`${event.timestamp}-${event.type}-${event.message}`} className="dash-event">
                    <span className="dash-event-time">{formatClock(event.timestamp)}</span>
                    <span className={`dash-event-tag ${eventTone(event.severity)}`}>{event.type}</span>
                    <span className="dash-event-msg">{event.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="dash-module-note">{model.eventLogEmptyState}</div>
            )}
          </section>

          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Workers</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">{model.workersStatus}</span>
              </div>
            </div>
            <MetricList rows={[
              ['Processados', model.workers.processed],
              ['Falha terminal', model.workers.failedTerminal],
              ['Latencia media', `${model.workers.averageLatencyMs} ms`],
              ['Ultimo evento', formatDateTime(model.slo.lastEventAt)],
            ]} />
          </section>
        </div>

        {viewState.errorMessage ? (
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Estado do runtime</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">erro</span>
              </div>
            </div>
            <div className="dash-module-note">{viewState.errorMessage}</div>
          </section>
        ) : null}
      </div>
    </WorkspacePageFrame>
  )
}

function MetricList({ rows, emptyState }: { rows: Array<[string, string | number]>; emptyState?: string }) {
  if (rows.length === 0) {
    return <div className="dash-module-note">{emptyState ?? 'Sem dados nesta janela.'}</div>
  }

  return (
    <div className="dash-table-scroll dash-table-scroll--tight">
      <table className="dash-table">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td className="name">{label}</td>
              <td className="dim">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function buildDashboardModel(viewState: DashboardViewState) {
  const dashboard = viewState.dashboard
  const throughput = dashboard?.sections.throughput.data ?? {
    jobs_total: 0,
    uploads_total: 0,
    completed: 0,
    failed: 0,
    quarantined: 0,
  }
  const queue = dashboard?.sections.queue.data ?? { processed: 0, retried: 0, moved_to_dlq: 0 }
  const workers = dashboard?.sections.workers.data ?? { processed: 0, failed_terminal: 0, average_latency_ms: 0 }
  const warnings = dashboard?.sections.warnings.data ?? { open: 0, failed: 0, resolved: 0 }
  const eventLog = dashboard?.sections.event_log.data ?? []
  const formats = dashboard?.sections.formats.data ?? []
  const successRate = throughput.jobs_total > 0 ? Math.round((throughput.completed / throughput.jobs_total) * 1000) / 10 : 0

  return {
    source: dashboard?.source ?? 'empty',
    snapshotStatus: sectionStatusLabel('Snapshot', dashboard?.sections.throughput.status),
    queueStatus: sectionStatusLabel('Queue', dashboard?.sections.queue.status),
    workersStatus: sectionStatusLabel('Workers', dashboard?.sections.workers.status),
    warningsStatus: sectionStatusLabel('Warnings', dashboard?.sections.warnings.status),
    formatsStatus: sectionStatusLabel('Formats', dashboard?.sections.formats.status),
    eventLogStatus: sectionStatusLabel('Event log', dashboard?.sections.event_log.status),
    kpis: [
      { label: 'Jobs hoje', value: formatNumber(throughput.jobs_total), sub: 'janela atual', tag: dashboard?.sections.throughput.status ?? 'empty', className: 'k1', tagTone: 'info' },
      { label: 'Concluidos', value: formatNumber(throughput.completed), sub: 'taxa de sucesso', tag: `${successRate}%`, className: 'k2', tagTone: 'up' },
      { label: 'Falhos', value: formatNumber(throughput.failed), sub: 'falhas do periodo', tag: throughput.failed > 0 ? 'revisar' : 'ok', className: 'k3', tagTone: throughput.failed > 0 ? 'down' : 'up' },
      { label: 'Quarentena', value: formatNumber(throughput.quarantined), sub: 'jobs com alerta', tag: warnings.open > 0 ? 'aberto' : 'limpo', className: 'k4', tagTone: warnings.open > 0 ? 'warn' : 'up' },
      { label: 'Uploads', value: formatNumber(throughput.uploads_total), sub: 'entradas registradas', tag: '+ Upload', className: 'k5', tagTone: 'info' },
    ],
    metrics: [
      { label: 'Jobs totais', value: formatNumber(throughput.jobs_total), hint: 'derivado do backend' },
      { label: 'Uploads totais', value: formatNumber(throughput.uploads_total), hint: 'derivado do backend' },
      { label: 'Falhas', value: formatNumber(throughput.failed), hint: 'sem extrapolacao visual' },
      { label: 'Quarentena', value: formatNumber(throughput.quarantined), hint: 'sem fixture local' },
    ],
    queue: {
      processed: formatNumber(queue.processed),
      retried: formatNumber(queue.retried),
      movedToDlq: formatNumber(queue.moved_to_dlq),
    },
    workers: {
      processed: formatNumber(workers.processed),
      failedTerminal: formatNumber(workers.failed_terminal),
      averageLatencyMs: formatNumber(workers.average_latency_ms),
    },
    warnings: {
      open: formatNumber(warnings.open),
      failed: formatNumber(warnings.failed),
      resolved: formatNumber(warnings.resolved),
    },
    formats: formats.map((format) => [format.content_type, formatNumber(format.count)] as [string, string]),
    formatsEmptyState: dashboard?.sections.formats.empty_state ?? 'Nenhum formato observado nesta janela.',
    eventLog,
    eventLogEmptyState: dashboard?.sections.event_log.empty_state ?? 'Nenhum evento observado nesta janela.',
    jobs: viewState.jobs,
    uploads: viewState.uploads,
    jobsEmptyState: 'Nenhum job recente retornado pelo backend.',
    dependencies: Object.entries(dashboard?.dependencies ?? {}).map(([name, dependency]) => ({
      name,
      status: dependency.status,
      source: dependency.source ?? '--',
      detail: dependency.fallback_reason ?? dependency.reason ?? '--',
      statusClass: statusPillClass(dependency.status),
    })),
    slo: {
      targetSeconds: dashboard?.slo.slo_target_seconds ?? 0,
      lagSeconds: dashboard?.slo.lag_seconds === null || dashboard?.slo.lag_seconds === undefined ? '--' : `${dashboard.slo.lag_seconds}s`,
      stale: dashboard?.slo.stale ?? false,
      p95Ms: formatNumber(dashboard?.slo.p95_ms ?? 0),
      errorBudgetPercent: dashboard?.slo.error_budget_percent ?? 0,
      lastEventAt: dashboard?.slo.last_event_at ?? null,
    },
  }
}

function sectionStatusLabel(label: string, status: string | null | undefined) {
  return `${label} ${status ?? 'empty'}`
}

function eventTone(severity: AnalyticsDashboardEvent['severity']) {
  if (severity === 'error') return 'error'
  if (severity === 'warning') return 'warn'
  return 'ok'
}

function formatClock(value: string | null | undefined) {
  if (!value) return '--'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '--'

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(parsed)
}

function statusPillClass(status: string) {
  if (status === 'healthy' || status === 'completed' || status === 'resolved') return 'dash-pill dash-pill--done'
  if (status === 'failed' || status === 'error' || status === 'unhealthy') return 'dash-pill dash-pill--failed'
  if (status === 'degraded' || status.includes('quarantine')) return 'dash-pill dash-pill--quarantine'
  if (status === 'processing' || status === 'retrying') return 'dash-pill dash-pill--processing'
  return 'dash-pill dash-pill--neutral'
}
