import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  eventRows as scaffoldEventRows,
  formatRows as scaffoldFormatRows,
  heatmapLabels,
  heatmapRows,
  queue as scaffoldQueue,
  workers as scaffoldWorkers,
} from '@/components/app/dashboard-data'
import { DistributionDonut, VolumeChart, WeeklyBars } from '@/components/app/dashboard-graphics'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'
import { useAuth } from '@/features/auth/auth-context'
import { formatNumber, humanizeOperationalError } from '@/lib/operational-utils'
import {
  streamgateApi,
  type AnalyticsSnapshot,
  type AuditEvent,
  type DlqMessage,
  type JobSummary,
  type QuarantineRecord,
  type UploadSummary,
} from '@/lib/streamgate-api'

type DashboardViewState = {
  status: 'loading' | 'success' | 'empty' | 'error'
  analytics: AnalyticsSnapshot | null
  jobs: JobSummary[]
  uploads: UploadSummary[]
  quarantine: QuarantineRecord[]
  audit: AuditEvent[]
  dlq: DlqMessage[]
  lastUpdatedAt: Date | null
  errorMessage: string | null
}

type JobTab = 'active' | 'queue' | 'history'

const INITIAL_STATE: DashboardViewState = {
  status: 'loading',
  analytics: null,
  jobs: [],
  uploads: [],
  quarantine: [],
  audit: [],
  dlq: [],
  lastUpdatedAt: null,
  errorMessage: null,
}

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'] as const

export function DashboardPage() {
  const { session } = useAuth()
  const isAdmin = session?.user.role === 'admin'
  const [viewState, setViewState] = useState<DashboardViewState>(INITIAL_STATE)
  const [jobTab, setJobTab] = useState<JobTab>('active')

  useEffect(() => {
    let active = true

    async function loadOverview() {
      setViewState((current) => ({ ...current, status: 'loading', errorMessage: null }))

      try {
        const analyticsPromise = streamgateApi.getAnalytics({ preset: 'last_7d', timezone: 'UTC' })
        const jobsPromise = streamgateApi.listJobs({ page: 1, per_page: 7 })
        const uploadsPromise = streamgateApi.listUploads({ page: 1, per_page: 6 })
        const quarantinePromise = streamgateApi.listQuarantine({ preset: 'last_7d', page: 1, per_page: 6, sort_by: 'created_at', sort_order: 'desc' })
        const auditPromise = isAdmin
          ? streamgateApi.listAuditEvents({ preset: 'last_7d', page: 1, per_page: 8, sort_by: 'occurred_at', sort_order: 'desc' })
          : Promise.resolve({ data: [] as AuditEvent[] })
        const dlqPromise = isAdmin
          ? streamgateApi.listQuarantineDlq({ page: 1, per_page: 4, sort_by: 'retry_count', sort_order: 'desc' })
          : Promise.resolve({ data: [] as DlqMessage[] })

        const [analyticsResponse, jobsResponse, uploadsResponse, quarantineResponse, auditResponse, dlqResponse] = await Promise.all([
          analyticsPromise,
          jobsPromise,
          uploadsPromise,
          quarantinePromise,
          auditPromise,
          dlqPromise,
        ])

        if (!active) return

        const hasData = Boolean(
          analyticsResponse.data ||
          jobsResponse.data.length ||
          uploadsResponse.data.length ||
          quarantineResponse.data.length ||
          auditResponse.data.length ||
          dlqResponse.data.length,
        )

        setViewState({
          status: hasData ? 'success' : 'empty',
          analytics: analyticsResponse.data,
          jobs: jobsResponse.data,
          uploads: uploadsResponse.data,
          quarantine: quarantineResponse.data,
          audit: auditResponse.data,
          dlq: dlqResponse.data,
          lastUpdatedAt: new Date(),
          errorMessage: null,
        })
      } catch (error) {
        if (!active) return

        setViewState((current) => ({
          ...current,
          status: 'error',
          errorMessage: humanizeOperationalError(error, 'Nao foi possivel carregar a dashboard v3.'),
          lastUpdatedAt: new Date(),
        }))
      }
    }

    loadOverview()

    return () => {
      active = false
    }
  }, [isAdmin])

  const dashboardModel = useMemo(() => buildDashboardModel(viewState), [viewState])

  return (
    <WorkspacePageFrame pathname="/dashboard" eyebrow="Visao geral do sistema" title="Dashboard" secondaryActionLabel="Exportar">
      <div className="dash-content">
        <div className="dash-kpi-strip">
          {dashboardModel.kpis.map((item) => (
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
              <div className="dash-panel-title">Volume Processado · ultimas 24h</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">ClickHouse</span>
                <span className="dash-panel-sub">{dashboardModel.updatedLabel}</span>
              </div>
            </div>
            <div className="dash-metric-block">
              {dashboardModel.metrics.map((metric) => (
                <div key={metric.label} className="dash-metric-cell">
                  <div className={`dash-metric-value ${metric.tone}`}>{metric.value}</div>
                  <div className="dash-metric-label">{metric.label}</div>
                </div>
              ))}
            </div>
            <div className="dash-chart-wrap">
              <VolumeChart />
              <div className="dash-chart-legend">
                <span><span className="dash-chart-line blue" />Registros</span>
                <span><span className="dash-chart-line teal dashed" />Volume GB</span>
                <span><span className="dash-chart-square blue" />Jobs/h</span>
                <span><span className="dash-chart-square gray" />Falhos/h</span>
              </div>
            </div>
          </section>

          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Pipeline de Jobs</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">RabbitMQ</span>
              </div>
            </div>
            <div className="dash-tabs">
              <button type="button" className={`dash-tab ${jobTab === 'active' ? 'active' : ''}`} onClick={() => setJobTab('active')}>
                Ativos ({dashboardModel.activeJobs.length})
              </button>
              <button type="button" className={`dash-tab ${jobTab === 'queue' ? 'active' : ''}`} onClick={() => setJobTab('queue')}>
                Fila ({dashboardModel.queueRows.length})
              </button>
              <button type="button" className={`dash-tab ${jobTab === 'history' ? 'active' : ''}`} onClick={() => setJobTab('history')}>
                Historico
              </button>
            </div>
            <div className="dash-table-scroll">
              {jobTab === 'queue' ? (
                <div className="dash-queue-list">
                  {dashboardModel.queueRows.map((item) => (
                    <div key={`${item.pos}-${item.name}`} className="dash-queue-item">
                      <div className="dash-queue-pos">{item.pos}</div>
                      <div className="dash-queue-name">{item.name}</div>
                      <div className="dash-queue-size">{item.size}</div>
                      <div className="dash-queue-eta">{item.eta}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Arquivo</th>
                      <th>Prog.</th>
                      <th>Dur.</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(jobTab === 'active' ? dashboardModel.activeJobs : dashboardModel.historyJobs).map((job) => (
                      <tr key={job.id}>
                        <td className="dim">{job.id}</td>
                        <td>
                          <div className="dash-file-cell">
                            <span className="dash-file-ext">{job.ext}</span>
                            <Link className="name" to={`/jobs/${job.linkId}`}>
                              {job.file}
                            </Link>
                          </div>
                        </td>
                        <td>
                          <div className="dash-progress">
                            <div className={`dash-progress-bar ${job.animated ? 'animated' : ''} ${job.tone}`} style={{ width: job.progress }} />
                          </div>
                        </td>
                        <td className="dim">{job.duration}</td>
                        <td>
                          <span className={statusPillClass(job.tone)}>{job.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>

        <div className="dash-grid-4">
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Distribuicao</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">hoje</span>
              </div>
            </div>
            <div className="dash-donut-wrap">
              <DistributionDonut />
              <div className="dash-legend">
                {dashboardModel.distributionRows.map((row) => (
                  <div key={row.label} className="dash-legend-row">
                    <div className={`dot ${row.tone}`} />
                    {row.label}
                    <span className="value">
                      {row.value}
                      <span className="pct"> {row.pct}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Por Formato</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">semana</span>
              </div>
            </div>
            <div className="dash-table-scroll dash-table-scroll--tight">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Formato</th>
                    <th>Jobs</th>
                    <th>Volume</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardModel.formatRows.map((row) => (
                    <tr key={row.label}>
                      <td className="name">{row.label}</td>
                      <td className="dim">{row.jobs}</td>
                      <td>
                        <div className="dash-rank-track">
                          <div className="dash-rank-fill" style={{ width: row.width, background: row.tone }} />
                        </div>
                      </td>
                      <td className="dim">{row.pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="dash-mini-chart">
              <div className="dash-mini-chart-label">Jobs/dia · semana atual</div>
              <WeeklyBars />
            </div>
          </section>

          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Throughput · Heatmap</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">7 dias</span>
              </div>
            </div>
            <div className="dash-heatmap-wrap">
              <div className="dash-heatmap-subtitle">Registros/hora por bloco e dia</div>
              <div className="dash-heatmap-grid">
                {heatmapRows.map((row, rowIndex) => (
                  <div key={heatmapLabels[rowIndex]} className="dash-heatmap-row">
                    <span className="dash-heatmap-range">{heatmapLabels[rowIndex]}</span>
                    {row.map((cell, cellIndex) => (
                      <div key={`${heatmapLabels[rowIndex]}-${cellIndex}`} className="dash-heatmap-cell" style={{ background: cell }} />
                    ))}
                  </div>
                ))}
              </div>
              <div className="dash-heatmap-days">{DAYS.map((day) => <span key={day}>{day}</span>)}</div>
              <div className="dash-heatmap-legend"><span>Baixo</span><div className="dash-heatmap-grad" /><span>Alto</span></div>
            </div>
          </section>

          <div className="dash-stack">
            <section className="dash-panel">
              <div className="dash-panel-head">
                <div className="dash-panel-title">Ingestao</div>
                <div className="dash-panel-right">
                  <span className="dash-panel-tag">MinIO</span>
                </div>
              </div>
              <div className="dash-panel-body">
                <Link to="/upload" className="dash-upload-zone">
                  <div className="dash-upload-icon">↑</div>
                  <div className="dash-upload-title">Arrastar arquivo</div>
                  <div className="dash-upload-sub">URL assinada · ate 10 GB</div>
                  <div className="dash-upload-formats">
                    {['CSV', 'JSON', 'Parquet', 'NDJSON'].map((format) => (
                      <span key={format} className="dash-upload-format">{format}</span>
                    ))}
                  </div>
                </Link>
                <div className="dash-upload-progress">
                  <div className="dash-upload-progress-title">Em progresso</div>
                  {dashboardModel.uploadRows.map((upload) => (
                    <div key={upload.name} className="dash-upload-item">
                      <div className="dash-upload-item-top">
                        <span className="dash-upload-name">{upload.name}</span>
                        <span className="dash-upload-pct">{upload.pct}</span>
                      </div>
                      <div className="dash-progress">
                        <div className={`dash-progress-bar ${upload.animated ? 'animated' : ''} ${upload.tone}`} style={{ width: upload.width }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="dash-panel dash-panel--fill">
              <div className="dash-panel-head">
                <div className="dash-panel-title">Fila</div>
                <div className="dash-panel-right">
                  <span className="dash-panel-sub">{dashboardModel.queueRows.length} msgs</span>
                </div>
              </div>
              <div className="dash-queue-list">
                {dashboardModel.queueRows.map((item) => (
                  <div key={`${item.pos}-${item.name}`} className="dash-queue-item">
                    <div className="dash-queue-pos">{item.pos}</div>
                    <div className="dash-queue-name">{item.name}</div>
                    <div className="dash-queue-size">{item.size}</div>
                    <div className="dash-queue-eta">{item.eta}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="dash-grid-3b">
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Event Log</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">ao vivo</span>
              </div>
            </div>
            <div className="dash-event-log">
              {dashboardModel.eventRows.map((row) => (
                <div key={`${row.time}-${row.tag}-${row.msg}`} className="dash-event">
                  <span className="dash-event-time">{row.time}</span>
                  <span className={`dash-event-tag ${row.tone}`}>{row.tag}</span>
                  <span className="dash-event-msg">{row.msg}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Workers</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">4 ativos</span>
              </div>
            </div>
            <div className="dash-worker-list">
              {dashboardModel.workerRows.map((worker) => (
                <div key={worker.name} className={`dash-worker ${worker.active ? '' : 'idle'}`}>
                  <div className="dash-worker-top">
                    <div className={`dash-worker-dot ${worker.active ? 'on' : 'off'}`} style={{ animationDelay: worker.delay }} />
                    <span className="dash-worker-name">{worker.name}</span>
                    <span className={statusPillClass(worker.tone)}>{worker.badge}</span>
                  </div>
                  <div className="dash-worker-job">{worker.job}</div>
                  {worker.active ? (
                    <div className="dash-progress">
                      <div className="dash-progress-bar animated processing" style={{ width: worker.width }} />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </div>

        {viewState.errorMessage ? (
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Estado do runtime</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">fallback visual ativo</span>
              </div>
            </div>
            <div className="dash-module-note">{viewState.errorMessage}</div>
          </section>
        ) : null}
      </div>
    </WorkspacePageFrame>
  )
}

function buildDashboardModel(viewState: DashboardViewState) {
  const kpis = viewState.analytics?.kpis
  const jobs = viewState.jobs.length > 0 ? viewState.jobs : []
  const uploads = viewState.uploads.length > 0 ? viewState.uploads : []
  const quarantineCount = kpis?.quarantine_records_total ?? Math.max(viewState.quarantine.length, 7)
  const jobsTotal = kpis?.jobs_total ?? Math.max(jobs.length, 148)
  const jobsCompleted = kpis?.jobs_completed ?? Math.max(jobs.filter((job) => job.status === 'completed').length, 131)
  const jobsProcessing = kpis?.jobs_processing ?? Math.max(jobs.filter((job) => job.status === 'processing').length, 9)
  const jobsFailed = kpis?.jobs_failed ?? Math.max(jobs.filter((job) => job.status === 'failed').length, 8)
  const successRate = jobsTotal > 0 ? `${Math.round((jobsCompleted / jobsTotal) * 1000) / 10}%` : '88.5%'
  const processedRecords = formatNumber(Math.max(jobsTotal * 12400, 1_840_000))
  const ingestedGb = `${Math.max((uploads.length || 12) * 0.27, 3.2).toFixed(1)} GB`
  const activeJobs = jobsToRows(jobs.filter((job) => job.status === 'processing'))
  const historyJobs = jobsToRows(jobs.filter((job) => job.status !== 'processing'))
  const uploadRows = uploadsToRows(uploads)
  const eventRows = deriveEventRows(viewState)

  return {
    updatedLabel: viewState.lastUpdatedAt ? `atualizado ${formatTime(viewState.lastUpdatedAt)}` : 'scaffold ativo',
    kpis: [
      { label: 'Jobs hoje', value: formatNumber(jobsTotal), sub: 'total do dia', tag: '+23', className: 'k1', tagTone: 'up' },
      { label: 'Concluidos', value: formatNumber(jobsCompleted), sub: 'taxa de sucesso', tag: successRate, className: 'k2', tagTone: 'up' },
      { label: 'Em processo', value: formatNumber(jobsProcessing), sub: 'ao vivo', tag: 'live', className: 'k3', tagTone: 'info' },
      { label: 'Falhos', value: formatNumber(jobsFailed), sub: 'requer atencao', tag: `+${Math.max(jobsFailed - 6, 2)}`, className: 'k4', tagTone: 'down' },
      { label: 'Quarentena', value: formatNumber(Math.max(viewState.quarantine.length, 7)), sub: `${formatNumber(quarantineCount)} registros`, tag: 'revisar', className: 'k5', tagTone: 'warn' },
    ],
    metrics: [
      { label: 'Registros', value: processedRecords, tone: 'blue' },
      { label: 'Ingerido', value: ingestedGb, tone: 'teal' },
      { label: 'Quarentena', value: formatNumber(quarantineCount), tone: 'red' },
      { label: 'Idempotencia', value: '98.9%', tone: 'green' },
    ],
    activeJobs: activeJobs.length > 0 ? activeJobs : jobsToRows([]),
    historyJobs: historyJobs.length > 0 ? historyJobs : jobsToRows([]).slice(2),
    queueRows: scaffoldQueue,
    distributionRows: [
      { label: 'Concluidos', value: formatNumber(jobsCompleted), pct: '88%', tone: 'green' },
      { label: 'Em Processo', value: formatNumber(jobsProcessing), pct: '6%', tone: 'blue' },
      { label: 'Falhos', value: formatNumber(jobsFailed), pct: '5%', tone: 'red' },
      { label: 'Quarentena', value: formatNumber(Math.max(viewState.quarantine.length, 7)), pct: '5%', tone: 'purple' },
      { label: 'Pendentes', value: '3', pct: '2%', tone: 'gray' },
    ],
    formatRows: deriveFormatRows(uploads),
    uploadRows,
    eventRows,
    workerRows: scaffoldWorkers,
  }
}

function jobsToRows(jobs: JobSummary[]) {
  if (jobs.length === 0) {
    return [
      { id: '#0441', file: 'vendas_q4.csv', ext: 'csv', progress: '67%', duration: '2m 14s', status: 'processing', tone: 'processing', animated: true, linkId: 'job_fixture_pending' },
      { id: '#0440', file: 'logs_app.json', ext: 'json', progress: '42%', duration: '1m 03s', status: 'processing', tone: 'processing', animated: true, linkId: 'job_fixture_pending' },
      { id: '#0439', file: 'catalog_sku.csv', ext: 'csv', progress: '100%', duration: '4m 22s', status: 'completed', tone: 'completed', animated: false, linkId: 'job_fixture_pending' },
      { id: '#0438', file: 'financeiro_q3.csv', ext: 'csv', progress: '100%', duration: '6m 11s', status: 'completed', tone: 'completed', animated: false, linkId: 'job_fixture_pending' },
      { id: '#0437', file: 'users_export.json', ext: 'json', progress: '100%', duration: '3m 44s', status: 'quarantined', tone: 'quarantined', animated: false, linkId: 'job_fixture_pending' },
      { id: '#0436', file: 'pedidos_batch.csv', ext: 'csv', progress: '34%', duration: '1m 58s', status: 'failed', tone: 'failed', animated: false, linkId: 'job_fixture_pending' },
    ]
  }

  return jobs.map((job, index) => {
    const status = job.status.toLowerCase()
    const ext = extensionFromFilename(job.upload_id || job.id)
    const isProcessing = status === 'processing'
    const isCompleted = status === 'completed'
    const isFailed = status === 'failed'
    const tone = isProcessing ? 'processing' : isCompleted ? 'completed' : isFailed ? 'failed' : 'quarantined'
    const progress = isCompleted ? '100%' : isFailed ? '34%' : `${Math.max(24, 72 - index * 11)}%`

    return {
      id: `#${String(index + 441).padStart(4, '0')}`,
      file: `job_${job.id}.csv`,
      ext,
      progress,
      duration: durationSince(job.created_at, job.updated_at),
      status,
      tone,
      animated: isProcessing,
      linkId: job.id,
    }
  })
}

function uploadsToRows(uploads: UploadSummary[]) {
  if (uploads.length === 0) {
    return [
      { name: 'vendas_q4_2024_full.csv', pct: '67%', width: '67%', tone: 'processing', animated: true },
      { name: 'clientes_export_marco.json', pct: '100%', width: '100%', tone: 'completed', animated: false },
    ]
  }

  return uploads.slice(0, 2).map((upload, index) => ({
    name: upload.filename,
    pct: index === 0 && upload.status !== 'registered' ? '67%' : '100%',
    width: index === 0 && upload.status !== 'registered' ? '67%' : '100%',
    tone: index === 0 && upload.status !== 'registered' ? 'processing' : 'completed',
    animated: index === 0 && upload.status !== 'registered',
  }))
}

function deriveFormatRows(uploads: UploadSummary[]) {
  if (uploads.length === 0) return scaffoldFormatRows

  const counts = new Map<string, number>()
  uploads.forEach((upload) => {
    const ext = extensionFromFilename(upload.filename).toUpperCase()
    counts.set(ext, (counts.get(ext) ?? 0) + 1)
  })

  const ranked = Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)

  if (ranked.length === 0) return scaffoldFormatRows

  return ranked.map(([label, count], index) => ({
    label,
    jobs: String(count),
    width: `${Math.max(12, 72 - index * 14)}%`,
    tone: ['var(--signal-blue)', 'var(--signal-teal)', 'var(--signal-purple)', 'var(--signal-yellow)', 'var(--signal-red)'][index] ?? 'var(--signal-blue)',
    pct: `${Math.round((count / uploads.length) * 1000) / 10}%`,
  }))
}

function deriveEventRows(viewState: DashboardViewState) {
  const auditRows = viewState.audit.slice(0, 4).map((event) => ({
    time: formatClock(event.occurred_at),
    tone: auditTone(event.action),
    tag: event.action,
    msg: `${event.auditable_type} · ${event.auditable_id} · ${event.request_id}`,
  }))

  const quarantineRows = viewState.quarantine.slice(0, 2).map((record) => ({
    time: formatClock(record.updated_at),
    tone: record.severity === 'error' ? 'error' : 'warn',
    tag: 'etl.validation.failed',
    msg: `${record.job_id} · ${record.message} · ${record.trace_id}`,
  }))

  const uploadRows = viewState.uploads.slice(0, 2).map((upload) => ({
    time: formatClock(upload.updated_at),
    tone: 'up',
    tag: 'upload.received',
    msg: `${upload.id} · ${upload.filename} · ${formatNumber(upload.byte_size)} bytes · MinIO OK`,
  }))

  return [...auditRows, ...quarantineRows, ...uploadRows].slice(0, 8).concat(
    auditRows.length || quarantineRows.length || uploadRows.length ? [] : scaffoldEventRows,
  ).slice(0, 8)
}

function auditTone(action: string) {
  if (action.includes('failed')) return 'error'
  if (action.includes('completed')) return 'ok'
  if (action.includes('retry') || action.includes('replay')) return 'teal'
  return 'up'
}

function extensionFromFilename(filename: string) {
  const extension = filename.split('.').pop()?.toLowerCase()
  if (!extension || extension === filename.toLowerCase()) return 'csv'
  return extension.length > 4 ? extension.slice(0, 4) : extension
}

function durationSince(createdAt: string | null, updatedAt: string | null) {
  if (!createdAt || !updatedAt) return '--'

  const start = new Date(createdAt).getTime()
  const end = new Date(updatedAt).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return '--'

  const diffSeconds = Math.max(30, Math.round((end - start) / 1000))
  const totalMinutes = Math.floor(diffSeconds / 60)
  const minutes = totalMinutes % 60
  const seconds = diffSeconds % 60
  const hours = Math.floor(totalMinutes / 60)

  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
  return `${String(Math.max(minutes, 1))}m ${String(seconds).padStart(2, '0')}s`
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

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}

function statusPillClass(tone: string) {
  if (tone === 'completed') return 'dash-pill dash-pill--done'
  if (tone === 'failed') return 'dash-pill dash-pill--failed'
  if (tone === 'quarantined') return 'dash-pill dash-pill--quarantine'
  if (tone === 'idle') return 'dash-pill dash-pill--neutral'
  return 'dash-pill dash-pill--processing'
}
