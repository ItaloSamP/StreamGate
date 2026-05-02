import { buildCsv, formatDateTime, formatNumber, maskOperationalPayload } from '@/lib/operational-utils'
import type {
  AnalyticsDashboardAlert,
  AnalyticsDashboardEvent,
  AnalyticsDashboardFormatItem,
  AnalyticsDashboardJobBoardItem,
  AnalyticsDashboardQueueItem,
  AnalyticsDashboardSection,
  AnalyticsDashboardSnapshot,
  AnalyticsDashboardTimeseriesPoint,
  AnalyticsDashboardWorkerLive,
  JobSummary,
  UploadSummary,
} from '@/lib/streamgate-api'

export type DashboardRole = 'operator' | 'admin' | 'service_account'
export type DashboardModelStatus = 'live' | 'derived' | 'empty' | 'degraded' | 'backend-pending' | string
export type DashboardTone = 'up' | 'down' | 'info' | 'warn' | 'neutral'
export type DashboardExportKind = 'snapshot' | 'series' | 'heatmap' | 'event_log'

export type DashboardDetailTarget = {
  type: 'kpi' | 'series' | 'distribution' | 'format' | 'heatmap' | 'job' | 'queue' | 'upload' | 'worker' | 'alert' | 'event' | 'source'
  title: string
  subtitle: string
  href: string
  rows: Array<[string, string | number]>
}

export type DashboardKpi = {
  id: string
  label: string
  value: string
  sub: string
  tag: string
  tagTone: DashboardTone
  className: string
  detail: DashboardDetailTarget
}

export type DashboardSeriesPoint = {
  label: string
  records: number
  volumeGb: number
  jobs: number
  failed: number
}

export type DashboardDistributionRow = {
  status: string
  count: number
  percent: number
  tone: string
}

export type DashboardFormatRow = {
  label: string
  jobs: number
  percent: number
  width: string
  tone: string
  detail: DashboardDetailTarget
}

export type DashboardHeatmapRow = {
  range: string
  cells: { value: number; intensity: number; label: string }[]
}

export type DashboardJobRow = {
  id: string
  uploadId: string
  file: string
  ext: string
  progress: number
  duration: string
  status: string
  tone: string
  href: string
  detail: DashboardDetailTarget
}

export type DashboardQueueRow = {
  pos: string
  name: string
  size: string
  eta: string
  href: string
  detail: DashboardDetailTarget
}

export type DashboardUploadRow = {
  id: string
  name: string
  pct: string
  progress: number
  status: string
  sourceType: string
  detail: DashboardDetailTarget
}

export type DashboardWorkerRow = {
  id: string
  label: string
  badge: string
  tone: string
  job: string
  progress: number
  active: boolean
  detail: DashboardDetailTarget
}

export type DashboardAlertRow = {
  id: string
  title: string
  message: string
  severity: string
  href: string
  persistence: 'backend-pending' | 'persisted'
  detail: DashboardDetailTarget
}

export type DashboardEventRow = {
  id: string
  time: string
  timestamp: string | null
  tone: string
  tag: string
  msg: string
  metadata?: Record<string, unknown>
  detail: DashboardDetailTarget
}

export type DashboardCommandCenterModel = {
  demoState: 'data-driven' | 'demo-preview'
  generatedAt: string | null
  source: string
  sourceLabel: string
  lastUpdatedLabel: string
  kpis: DashboardKpi[]
  metrics: Array<{ label: string; value: string; tone: string }>
  timeseries24h: {
    status: DashboardModelStatus
    points: DashboardSeriesPoint[]
    emptyState: string
    detail: DashboardDetailTarget
  }
  statusDistribution: {
    status: DashboardModelStatus
    rows: DashboardDistributionRow[]
    total: number
    detail: DashboardDetailTarget
  }
  formats: {
    status: DashboardModelStatus
    rows: DashboardFormatRow[]
    weeklyBars: { label: string; value: number }[]
    emptyState: string
  }
  heatmap7d: {
    status: DashboardModelStatus
    days: string[]
    rows: DashboardHeatmapRow[]
    emptyState: string
    detail: DashboardDetailTarget
  }
  jobsBoard: {
    status: DashboardModelStatus
    tabs: {
      active: { label: string; rows: DashboardJobRow[] }
      queue: { label: string; rows: DashboardJobRow[] }
      history: { label: string; rows: DashboardJobRow[] }
    }
    emptyState: string
  }
  queue: {
    status: DashboardModelStatus
    processed: string
    retried: string
    movedToDlq: string
    rows: DashboardQueueRow[]
    detail: DashboardDetailTarget
  }
  ingestion: {
    status: DashboardModelStatus
    formats: { label: string; state: 'enabled' | 'backend-pending' }[]
    uploads: DashboardUploadRow[]
    emptyState: string
  }
  workers: {
    status: DashboardModelStatus
    rows: DashboardWorkerRow[]
    aggregate: { processed: string; failedTerminal: string; averageLatencyMs: string }
  }
  alerts: {
    status: DashboardModelStatus
    rows: DashboardAlertRow[]
    emptyState: string
  }
  eventLog: {
    status: DashboardModelStatus
    rows: DashboardEventRow[]
    emptyState: string
  }
  sourceHealth: {
    rows: { name: string; status: string; source: string; detail: string; tone: string }[]
  }
  exports: {
    snapshot: { disabled: boolean; filename: string; headers: string[] }
    series: { disabled: boolean; filename: string; headers: string[] }
    heatmap: { disabled: boolean; filename: string; headers: string[] }
    eventLog: { disabled: boolean; filename: string; headers: string[] }
  }
}

const HEATMAP_RANGES = ['00-03', '03-06', '06-09', '09-12', '12-15', '15-18', '18-21', '21-24']
const HEATMAP_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']
const STATUS_TONES: Record<string, string> = {
  completed: 'var(--signal-green)',
  processing: 'var(--signal-blue)',
  pending: 'var(--text-faint)',
  queued: 'var(--text-faint)',
  failed: 'var(--signal-red)',
  quarantined: 'var(--signal-purple)',
  quarantined_with_warnings: 'var(--signal-purple)',
}

export function buildDashboardCommandCenterModel({
  dashboard,
  jobs,
  uploads,
  role,
  dismissedAlertIds,
  demoState = 'data-driven',
}: {
  dashboard: AnalyticsDashboardSnapshot | null
  jobs: JobSummary[]
  uploads: UploadSummary[]
  role: DashboardRole
  dismissedAlertIds: string[]
  demoState?: DashboardCommandCenterModel['demoState']
}): DashboardCommandCenterModel {
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
  const processingCount = countJobs(jobs, ['processing', 'retrying'])
  const successRate = throughput.jobs_total > 0 ? Math.round((throughput.completed / throughput.jobs_total) * 1000) / 10 : 0
  const source = dashboard?.source ?? 'empty'

  const timeseries24h = buildTimeseries(dashboard, throughput, uploads)
  const statusDistribution = buildStatusDistribution(dashboard, throughput, processingCount)
  const formats = buildFormats(dashboard)
  const heatmap7d = buildHeatmap(dashboard)
  const jobsBoard = buildJobsBoard(dashboard, jobs)
  const queueRows = buildQueueRows(dashboard, jobsBoard.tabs.queue.rows)
  const ingestion = buildIngestion(dashboard, uploads)
  const workerRows = buildWorkers(dashboard, workers)
  const sourceHealth = buildSourceHealth(dashboard, role)
  const eventLog = buildEventLog(dashboard)
  const alerts = buildAlerts(dashboard, warnings, dismissedAlertIds)

  const kpis: DashboardKpi[] = [
    kpi('jobs_today', 'Jobs hoje', formatNumber(throughput.jobs_total), 'total do dia', sectionTag(dashboard?.sections.throughput.status), 'info', 'k1', [
      ['Fonte', source],
      ['Janela', dashboard?.window.preset ?? 'last_24h'],
      ['Atualizado', formatDateTime(dashboard?.generated_at)],
    ]),
    kpi('completed', 'Concluidos', formatNumber(throughput.completed), 'taxa de sucesso', `${successRate}%`, 'up', 'k2', [
      ['Concluidos', throughput.completed],
      ['Jobs totais', throughput.jobs_total],
      ['Taxa', `${successRate}%`],
    ]),
    kpi('processing', 'Em processo', formatNumber(processingCount), 'ao vivo', timeseries24h.status === 'live' ? 'live' : 'backend-pending', 'info', 'k3', [
      ['Ativos', processingCount],
      ['Series 24h', timeseries24h.status],
      ['Fallback', source],
    ]),
    kpi('failed', 'Falhos', formatNumber(throughput.failed), 'requer atencao', throughput.failed > 0 ? 'revisar' : 'ok', throughput.failed > 0 ? 'down' : 'up', 'k4', [
      ['Falhos', throughput.failed],
      ['Alertas falhos', warnings.failed],
      ['Destino', '/quarantine'],
    ]),
    kpi('quarantine', 'Quarentena', formatNumber(throughput.quarantined), `${formatNumber(warnings.open)} abertos`, warnings.open > 0 ? 'revisar' : 'limpo', warnings.open > 0 ? 'warn' : 'up', 'k5', [
      ['Jobs em quarentena', throughput.quarantined],
      ['Alertas abertos', warnings.open],
      ['Resolvidos', warnings.resolved],
    ]),
  ]

  return {
    demoState,
    generatedAt: dashboard?.generated_at ?? null,
    source,
    sourceLabel: `Fonte: ${source}`,
    lastUpdatedLabel: dashboard?.generated_at ? `atualizado ${formatDateTime(dashboard.generated_at)}` : 'sem snapshot carregado',
    kpis,
    metrics: [
      { label: 'Registros', value: formatCompact(recordsTotal(timeseries24h.points)), tone: 'blue' },
      { label: 'Ingerido', value: `${formatDecimal(sum(timeseries24h.points.map((point) => point.volumeGb)))} GB`, tone: 'teal' },
      { label: 'Quarentena', value: formatNumber(throughput.quarantined), tone: 'red' },
      { label: 'Idempotencia', value: throughput.jobs_total > 0 ? `${successRate}%` : '--', tone: 'green' },
    ],
    timeseries24h,
    statusDistribution,
    formats,
    heatmap7d,
    jobsBoard,
    queue: {
      status: queueRows.length > 0 ? 'derived' : dashboard?.sections.queue.status ?? 'empty',
      processed: formatNumber(queue.processed),
      retried: formatNumber(queue.retried),
      movedToDlq: formatNumber(queue.moved_to_dlq),
      rows: queueRows,
      detail: detail('queue', 'Fila operacional', 'Mensagens pendentes e retry do worker.', '/jobs?status=pending', [
        ['Processados', queue.processed],
        ['Retentativas', queue.retried],
        ['DLQ', queue.moved_to_dlq],
      ]),
    },
    ingestion,
    workers: {
      status: workerRows.status,
      rows: workerRows.rows,
      aggregate: {
        processed: formatNumber(workers.processed),
        failedTerminal: formatNumber(workers.failed_terminal),
        averageLatencyMs: formatNumber(workers.average_latency_ms),
      },
    },
    alerts,
    eventLog,
    sourceHealth,
    exports: {
      snapshot: { disabled: kpis.length === 0, filename: 'streamgate-dashboard-snapshot.csv', headers: ['label', 'value', 'tag', 'source'] },
      series: { disabled: timeseries24h.points.length === 0, filename: 'streamgate-dashboard-series.csv', headers: ['label', 'records', 'volume_gb', 'jobs', 'failed', 'status'] },
      heatmap: { disabled: heatmap7d.rows.length === 0, filename: 'streamgate-dashboard-heatmap.csv', headers: ['range', 'day', 'value', 'status'] },
      eventLog: { disabled: eventLog.rows.length === 0, filename: 'streamgate-dashboard-event-log.csv', headers: ['timestamp', 'type', 'severity', 'message', 'job_id', 'upload_id', 'metadata'] },
    },
  }
}

export function buildDashboardPreviewModel(): DashboardCommandCenterModel {
  return buildDashboardCommandCenterModel({
    dashboard: {
      generated_at: '2026-04-24T14:00:00Z',
      source: 'demo-preview',
      window: { from: '2026-04-23T14:00:00Z', to: '2026-04-24T14:00:00Z', preset: 'last_24h', timezone: 'UTC' },
      sections: {
        queue: { status: 'derived', generated_at: '2026-04-24T14:00:00Z', data: { processed: 3, retried: 1, moved_to_dlq: 0 }, empty_state: null },
        workers: { status: 'derived', generated_at: '2026-04-24T14:00:00Z', data: { processed: 2, failed_terminal: 0, average_latency_ms: 120 }, empty_state: null },
        throughput: { status: 'derived', generated_at: '2026-04-24T14:00:00Z', data: { jobs_total: 148, uploads_total: 148, completed: 131, failed: 8, quarantined: 7 }, empty_state: null },
        formats: { status: 'derived', generated_at: '2026-04-24T14:00:00Z', data: [{ content_type: 'text/csv', count: 84 }, { content_type: 'application/json', count: 38 }], empty_state: null },
        warnings: { status: 'derived', generated_at: '2026-04-24T14:00:00Z', data: { open: 7, failed: 8, resolved: 3 }, empty_state: null },
        event_log: { status: 'derived', generated_at: '2026-04-24T14:00:00Z', data: [], empty_state: null },
      },
      dependencies: {},
      slo: { slo_target_seconds: 300, last_event_at: null, lag_seconds: null, stale: false, p95_ms: 0, error_budget_percent: 99 },
    },
    jobs: [],
    uploads: [],
    role: 'operator',
    dismissedAlertIds: [],
    demoState: 'demo-preview',
  })
}

export function buildDashboardExportRows(model: DashboardCommandCenterModel, kind: DashboardExportKind): Record<string, unknown>[] {
  if (kind === 'snapshot') {
    return model.kpis.map((kpi) => maskRow({
      label: kpi.label,
      value: kpi.value,
      tag: kpi.tag,
      source: model.source,
    }))
  }

  if (kind === 'series') {
    return model.timeseries24h.points.map((point) => maskRow({
      label: point.label,
      records: point.records,
      volume_gb: point.volumeGb,
      jobs: point.jobs,
      failed: point.failed,
      status: model.timeseries24h.status,
    }))
  }

  if (kind === 'heatmap') {
    return model.heatmap7d.rows.flatMap((row) =>
      row.cells.map((cell, index) => maskRow({
        range: row.range,
        day: model.heatmap7d.days[index] ?? String(index + 1),
        value: cell.value,
        status: model.heatmap7d.status,
      })),
    )
  }

  return model.eventLog.rows.map((row) => maskRow({
    timestamp: row.timestamp,
    type: row.tag,
    severity: row.tone,
    message: row.msg,
    job_id: row.detail.rows.find(([label]) => label === 'Job')?.[1] ?? '',
    upload_id: row.detail.rows.find(([label]) => label === 'Upload')?.[1] ?? '',
    metadata: row.metadata ?? {},
  }))
}

export function buildDashboardExportContent(model: DashboardCommandCenterModel, kind: DashboardExportKind, format: 'csv' | 'json') {
  const rows = buildDashboardExportRows(model, kind)

  if (format === 'json') {
    return JSON.stringify(rows, null, 2)
  }

  const headers = exportHeaders(model, kind)
  return buildCsv(rows, headers)
}

function kpi(
  id: string,
  label: string,
  value: string,
  sub: string,
  tag: string,
  tagTone: DashboardTone,
  className: string,
  rows: Array<[string, string | number]>,
): DashboardKpi {
  return {
    id,
    label,
    value,
    sub,
    tag,
    tagTone,
    className,
    detail: detail('kpi', label, 'Resumo do indicador e rota profunda para investigacao.', '/analytics?preset=last_24h', rows),
  }
}

function buildTimeseries(
  dashboard: AnalyticsDashboardSnapshot | null,
  throughput: { jobs_total: number; uploads_total: number; completed: number; failed: number; quarantined: number },
  uploads: UploadSummary[],
) {
  const section = dashboard?.sections.timeseries_24h
  const raw = section?.data ?? []

  if (raw.length > 0) {
    return {
      status: section?.status ?? 'live',
      points: raw.map(normalizeSeriesPoint),
      emptyState: section?.empty_state ?? 'Sem serie temporal nesta janela.',
      detail: detail('series', 'Serie 24h', 'Dados horarios recebidos do contrato expandido.', '/analytics?preset=last_24h', [
        ['Pontos', raw.length],
        ['Fonte', dashboard?.source ?? 'unknown'],
      ]),
    }
  }

  return {
    status: 'backend-pending',
    points: [{
      label: 'janela',
      records: throughput.jobs_total,
      volumeGb: bytesToGb(sum(uploads.map((upload) => upload.byte_size))),
      jobs: throughput.jobs_total,
      failed: throughput.failed,
    }],
    emptyState: 'Serie 24h depende do contrato expandido do command center.',
    detail: detail('series', 'Serie 24h', 'Backend ainda nao entrega bucket horario; exibindo agregado honesto da janela.', '/analytics?preset=last_24h', [
      ['Status', 'backend-pending'],
      ['Jobs agregados', throughput.jobs_total],
    ]),
  }
}

function buildStatusDistribution(
  dashboard: AnalyticsDashboardSnapshot | null,
  throughput: { jobs_total: number; completed: number; failed: number; quarantined: number },
  processingCount: number,
) {
  const section = dashboard?.sections.status_distribution
  const rawRows = section?.data
  const fallbackRows = [
    { status: 'completed', count: throughput.completed },
    { status: 'processing', count: processingCount },
    { status: 'failed', count: throughput.failed },
    { status: 'quarantined', count: throughput.quarantined },
    { status: 'pending', count: Math.max(throughput.jobs_total - throughput.completed - processingCount - throughput.failed - throughput.quarantined, 0) },
  ]
  const rows = rawRows && rawRows.length > 0 ? rawRows : fallbackRows
  const total = sum(rows.map((row) => row.count))

  return {
    status: section?.status ?? (rawRows ? 'derived' : 'backend-pending'),
    total,
    rows: rows
      .filter((row) => row.count > 0 || ['pending', 'processing'].includes(row.status))
      .map((row) => ({
        status: row.status,
        count: row.count,
        percent: total > 0 ? Math.round((row.count / total) * 1000) / 10 : 0,
        tone: STATUS_TONES[row.status] ?? 'var(--text-faint)',
      })),
    detail: detail('distribution', 'Distribuicao', 'Status derivados do snapshot atual.', '/jobs', [
      ['Total', total],
      ['Fonte', section?.status ?? 'fallback'],
    ]),
  }
}

function buildFormats(dashboard: AnalyticsDashboardSnapshot | null) {
  const section = dashboard?.sections.formats
  const rawRows = section?.data ?? []
  const total = sum(rawRows.map((row) => numeric(row.count, row.jobs)))
  const rows = rawRows.map((row, index) => {
    const jobs = numeric(row.count, row.jobs)
    const percent = numeric(row.percent, total > 0 ? (jobs / total) * 100 : 0)
    const label = formatLabel(row)

    return {
      label,
      jobs,
      percent: Math.round(percent * 10) / 10,
      width: `${Math.max(4, Math.min(100, percent))}%`,
      tone: formatTone(index, label),
      detail: detail('format', `Formato ${label}`, 'Ranking de formatos na janela atual.', '/clickhouse', [
        ['Jobs', jobs],
        ['Percentual', `${Math.round(percent * 10) / 10}%`],
        ['Status', section?.status ?? 'empty'],
      ]),
    }
  })

  return {
    status: section?.status ?? 'empty',
    rows,
    weeklyBars: buildWeeklyBars(rows),
    emptyState: section?.empty_state ?? 'Nenhum formato observado nesta janela.',
  }
}

function buildHeatmap(dashboard: AnalyticsDashboardSnapshot | null) {
  const section = dashboard?.sections.heatmap_7d
  const data = section?.data
  const days = data?.days && data.days.length > 0 ? data.days : HEATMAP_DAYS
  const rawRows = data?.rows && data.rows.length > 0
    ? data.rows
    : HEATMAP_RANGES.map((range) => ({ range, values: days.map(() => 0) }))
  const maxValue = Math.max(...rawRows.flatMap((row) => row.values), 0)

  return {
    status: section?.status ?? 'backend-pending',
    days,
    rows: rawRows.map((row) => ({
      range: row.range,
      cells: row.values.map((value, index) => ({
        value,
        intensity: maxValue > 0 ? value / maxValue : 0,
        label: `${row.range} ${days[index] ?? index + 1}: ${formatNumber(value)}`,
      })),
    })),
    emptyState: section?.empty_state ?? 'Heatmap 7d depende do contrato expandido do command center.',
    detail: detail('heatmap', 'Throughput - Heatmap', 'Registros por bloco horario e dia.', '/clickhouse', [
      ['Status', section?.status ?? 'backend-pending'],
      ['Dias', days.length],
    ]),
  }
}

function buildJobsBoard(dashboard: AnalyticsDashboardSnapshot | null, jobs: JobSummary[]) {
  const section = dashboard?.sections.jobs_board as AnalyticsDashboardSection<AnalyticsDashboardJobBoardItem[]> | undefined
  const sourceRows = section?.data && section.data.length > 0 ? section.data.map(jobBoardToSummary) : jobs
  const rows = sourceRows.map(toJobRow)
  const active = rows.filter((row) => ['processing', 'retrying'].includes(row.status))
  const queue = rows.filter((row) => ['pending', 'queued'].includes(row.status))
  const history = rows.filter((row) => !['processing', 'retrying', 'pending', 'queued'].includes(row.status))

  return {
    status: section?.status ?? (rows.length > 0 ? 'derived' : 'empty'),
    tabs: {
      active: { label: `Ativos (${active.length})`, rows: active },
      queue: { label: `Fila (${queue.length})`, rows: queue },
      history: { label: 'Historico', rows: history },
    },
    emptyState: section?.empty_state ?? 'Nenhum job nesta aba para a janela atual.',
  }
}

function buildQueueRows(dashboard: AnalyticsDashboardSnapshot | null, pendingJobs: DashboardJobRow[]): DashboardQueueRow[] {
  const section = dashboard?.sections.queue_items as AnalyticsDashboardSection<AnalyticsDashboardQueueItem[]> | undefined

  if (section?.data && section.data.length > 0) {
    return section.data.map((item, index) => queueItemToRow(item, index))
  }

  return pendingJobs.map((job, index) => ({
    pos: String(index + 1),
    name: job.file,
    size: '--',
    eta: '~',
    href: job.href,
    detail: detail('queue', `Fila ${job.id}`, 'Job aguardando processamento.', job.href, [
      ['Job', job.id],
      ['Upload', job.uploadId],
      ['Status', job.status],
    ]),
  }))
}

function buildIngestion(dashboard: AnalyticsDashboardSnapshot | null, uploads: UploadSummary[]) {
  const section = dashboard?.sections.ingestion
  const sectionData = section?.data
  const enabledFormats = new Set((sectionData?.enabled_formats ?? ['CSV', 'ZIP']).map((entry) => entry.toUpperCase()))
  const pendingFormats = new Set((sectionData?.pending_formats ?? ['JSON', 'Parquet', 'NDJSON', 'XLSX']).map((entry) => entry.toUpperCase()))
  const supported = sectionData?.supported_formats ?? ['CSV', 'ZIP', 'JSON', 'Parquet', 'NDJSON', 'XLSX']
  const formats: DashboardCommandCenterModel['ingestion']['formats'] = supported.map((label) => ({
    label,
    state: enabledFormats.has(label.toUpperCase()) && !pendingFormats.has(label.toUpperCase()) ? 'enabled' : 'backend-pending',
  }))

  return {
    status: section?.status ?? 'derived',
    formats,
    uploads: uploads.map(uploadToRow),
    emptyState: section?.empty_state ?? 'Nenhum upload recente nesta janela.',
  }
}

function buildWorkers(dashboard: AnalyticsDashboardSnapshot | null, aggregate: { processed: number; failed_terminal: number; average_latency_ms: number }) {
  const section = dashboard?.sections.workers_live as AnalyticsDashboardSection<AnalyticsDashboardWorkerLive[]> | undefined

  if (section?.data && section.data.length > 0) {
    return {
      status: section.status,
      rows: section.data.map(workerToRow),
    }
  }

  const processed = aggregate.processed
  const failed = aggregate.failed_terminal
  const total = processed + failed

  return {
    status: 'backend-pending',
    rows: [{
      id: 'worker-pool',
      label: 'worker-pool',
      badge: total > 0 ? 'ativo' : 'idle',
      tone: total > 0 ? 'processing' : 'idle',
      job: `Agregado atual: ${formatNumber(processed)} processados, ${formatNumber(failed)} falhas terminais`,
      progress: total > 0 ? Math.round((processed / total) * 100) : 0,
      active: total > 0,
      detail: detail('worker', 'Worker pool', 'Lista individual de workers depende do contrato expandido.', '/events', [
        ['Status', 'backend-pending'],
        ['Processados', processed],
        ['Falha terminal', failed],
      ]),
    }],
  }
}

function buildAlerts(
  dashboard: AnalyticsDashboardSnapshot | null,
  warnings: { open: number; failed: number; resolved: number },
  dismissedAlertIds: string[],
) {
  const section = dashboard?.sections.alerts as AnalyticsDashboardSection<AnalyticsDashboardAlert[]> | undefined
  const rows = section?.data && section.data.length > 0
    ? section.data.map(alertToRow)
    : warnings.open > 0 || warnings.failed > 0
      ? [alertToRow({
        id: 'dashboard-warning-open',
        title: 'Quarentena aberta',
        message: `${formatNumber(warnings.open)} alertas abertos e ${formatNumber(warnings.failed)} falhas recentes precisam de triagem.`,
        severity: warnings.failed > 0 ? 'warning' : 'info',
        href: '/quarantine',
      })]
      : []

  const visibleRows = rows.filter((row) => !dismissedAlertIds.includes(row.id))

  return {
    status: section?.status ?? (visibleRows.length > 0 ? 'derived' : 'empty'),
    rows: visibleRows,
    emptyState: section?.empty_state ?? 'Sem alertas ativos nesta janela.',
  }
}

function buildEventLog(dashboard: AnalyticsDashboardSnapshot | null) {
  const section = dashboard?.sections.event_log
  const rows = (section?.data ?? []).map(eventToRow)

  return {
    status: section?.status ?? 'empty',
    rows,
    emptyState: section?.empty_state ?? 'Nenhum evento observado nesta janela.',
  }
}

function buildSourceHealth(dashboard: AnalyticsDashboardSnapshot | null, role: DashboardRole) {
  return {
    rows: Object.entries(dashboard?.dependencies ?? {}).map(([name, dependency]) => ({
      name,
      status: dependency.status,
      source: dependency.source ?? '--',
      detail: role === 'admin'
        ? dependency.fallback_reason ?? dependency.reason ?? '--'
        : dependency.fallback_reason || dependency.reason
          ? 'fallback ativo'
          : '--',
      tone: statusTone(dependency.status),
    })),
  }
}

function normalizeSeriesPoint(point: AnalyticsDashboardTimeseriesPoint): DashboardSeriesPoint {
  return {
    label: point.label ?? point.bucket ?? point.timestamp?.slice(11, 16) ?? '--',
    records: numeric(point.records, point.records_count),
    volumeGb: numeric(point.volume_gb, point.volume_bytes ? bytesToGb(point.volume_bytes) : undefined),
    jobs: numeric(point.jobs, point.jobs_total),
    failed: numeric(point.failed, point.failed_jobs),
  }
}

function toJobRow(job: JobSummary): DashboardJobRow {
  const file = job.id.startsWith('job_') ? job.upload_id : job.id
  const ext = fileExtension(file)

  return {
    id: job.id,
    uploadId: job.upload_id,
    file,
    ext,
    progress: progressForStatus(job.status),
    duration: relativeDuration(job.created_at, job.updated_at),
    status: job.status,
    tone: jobTone(job.status),
    href: `/jobs/${job.id}`,
    detail: detail('job', job.id, 'Drilldown do job e lineage operacional.', `/jobs/${job.id}`, [
      ['Job', job.id],
      ['Upload', job.upload_id],
      ['Status', job.status],
      ['Trace', job.trace_id],
    ]),
  }
}

function jobBoardToSummary(item: AnalyticsDashboardJobBoardItem): JobSummary {
  return {
    id: item.id ?? 'job_unknown',
    upload_id: item.upload_id ?? item.filename ?? item.file ?? '--',
    requested_by_id: item.requested_by_id ?? '--',
    source_type: item.source_type ?? 'upload',
    status: item.status ?? 'pending',
    error_code: item.error_code ?? null,
    error_category: item.error_category ?? null,
    quarantined_records_count: item.quarantined_records_count ?? 0,
    trace_id: item.trace_id ?? '--',
    created_at: item.created_at ?? null,
    updated_at: item.updated_at ?? null,
  }
}

function queueItemToRow(item: AnalyticsDashboardQueueItem, index: number): DashboardQueueRow {
  const jobId = item.job_id ?? ''
  const href = jobId ? `/jobs/${jobId}` : '/jobs?status=pending'
  const rawName = item.name ?? item.filename ?? jobId
  const name = rawName.length > 0 ? rawName : `item-${index + 1}`

  return {
    pos: String(item.pos ?? item.position ?? index + 1),
    name,
    size: item.size ?? (item.byte_size ? humanBytes(item.byte_size) : '--'),
    eta: item.eta ?? '~',
    href,
    detail: detail('queue', name, 'Item de fila recebido do snapshot.', href, [
      ['Posicao', item.pos ?? item.position ?? index + 1],
      ['ETA', item.eta ?? '~'],
      ['Tamanho', item.size ?? (item.byte_size ? humanBytes(item.byte_size) : '--')],
    ]),
  }
}

function uploadToRow(upload: UploadSummary): DashboardUploadRow {
  const progress = upload.status === 'completed' ? 100 : upload.status === 'failed' ? 100 : upload.status === 'processing' ? 67 : 24

  return {
    id: upload.id,
    name: upload.filename,
    pct: `${progress}%`,
    progress,
    status: upload.status,
    sourceType: upload.source_type ?? 'upload',
    detail: detail('upload', upload.filename, 'Entrada registrada no Upload Center.', '/upload', [
      ['Upload', upload.id],
      ['Status', upload.status],
      ['Content type', upload.content_type],
    ]),
  }
}

function workerToRow(worker: AnalyticsDashboardWorkerLive): DashboardWorkerRow {
  const label = worker.name ?? worker.id
  const active = worker.active ?? ['active', 'processing', 'busy'].includes(worker.status)

  return {
    id: worker.id,
    label,
    badge: active ? 'ativo' : worker.status,
    tone: active ? 'processing' : 'idle',
    job: worker.current_job_id ? `${worker.current_job_id} - ${worker.current_label ?? 'em processamento'}` : 'Aguardando proximo job da fila',
    progress: Math.max(0, Math.min(100, worker.progress ?? (active ? 50 : 0))),
    active,
    detail: detail('worker', label, 'Worker individual recebido do contrato expandido.', '/events', [
      ['Worker', worker.id],
      ['Status', worker.status],
      ['Job atual', worker.current_job_id ?? '--'],
    ]),
  }
}

function alertToRow(alert: AnalyticsDashboardAlert): DashboardAlertRow {
  const href = alert.href ?? '/quarantine'
  const persisted = Boolean(alert.id && !alert.id.startsWith('dashboard-warning-open'))

  return {
    id: alert.id,
    title: alert.title,
    message: alert.message,
    severity: alert.severity,
    href,
    persistence: alert.dismissed_at || alert.reviewed_at || persisted ? 'persisted' : 'backend-pending',
    detail: detail('alert', alert.title, 'Alerta operacional com review/dismiss persistente no backend.', href, [
      ['Severidade', alert.severity],
      ['Persistencia', alert.dismissed_at || alert.reviewed_at || persisted ? 'persisted' : 'backend-pending'],
    ]),
  }
}

function eventToRow(event: AnalyticsDashboardEvent, index: number): DashboardEventRow {
  const semanticId = event.id ?? `${event.timestamp ?? 'no-time'}-${event.type}-${event.job_id ?? event.upload_id ?? event.message}`
  const id = `${semanticId}-${index}`

  return {
    id,
    time: formatClock(event.timestamp),
    timestamp: event.timestamp,
    tone: eventTone(event.severity),
    tag: event.type,
    msg: event.message,
    metadata: event.metadata,
    detail: detail('event', event.type, 'Evento operacional com rota profunda para investigacao.', event.job_id ? `/jobs/${event.job_id}` : '/events', [
      ['Job', event.job_id ?? '--'],
      ['Upload', event.upload_id ?? '--'],
      ['Status', event.status ?? '--'],
      ['Quando', formatDateTime(event.timestamp)],
    ]),
  }
}

function detail(
  type: DashboardDetailTarget['type'],
  title: string,
  subtitle: string,
  href: string,
  rows: Array<[string, string | number]>,
): DashboardDetailTarget {
  return { type, title, subtitle, href, rows }
}

function maskRow(row: Record<string, unknown>) {
  const masked = maskOperationalPayload(row) as Record<string, unknown>

  return Object.fromEntries(
    Object.entries(masked).map(([key, value]) => [
      key,
      value && typeof value === 'object' ? JSON.stringify(value) : value,
    ]),
  )
}

function exportHeaders(model: DashboardCommandCenterModel, kind: DashboardExportKind) {
  if (kind === 'snapshot') return model.exports.snapshot.headers
  if (kind === 'series') return model.exports.series.headers
  if (kind === 'heatmap') return model.exports.heatmap.headers
  return model.exports.eventLog.headers
}

function countJobs(jobs: JobSummary[], statuses: string[]) {
  return jobs.filter((job) => statuses.includes(job.status)).length
}

function sectionTag(status: string | null | undefined) {
  return status ?? 'empty'
}

function formatCompact(value: number) {
  if (value >= 1_000_000) return `${formatDecimal(value / 1_000_000)} M`
  if (value >= 1_000) return `${formatDecimal(value / 1_000)} k`
  return formatNumber(value)
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)
}

function recordsTotal(points: DashboardSeriesPoint[]) {
  return sum(points.map((point) => point.records))
}

function buildWeeklyBars(rows: DashboardFormatRow[]) {
  const total = sum(rows.map((row) => row.jobs))

  if (total === 0) {
    return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Hj'].map((label) => ({ label, value: 0 }))
  }

  return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Hj'].map((label, index) => ({
    label,
    value: Math.round(total * (0.35 + index * 0.08)),
  }))
}

function formatLabel(row: AnalyticsDashboardFormatItem) {
  const value = row.label ?? row.format ?? row.content_type ?? 'unknown'
  const lower = value.toLowerCase()

  if (lower.includes('csv')) return 'CSV'
  if (lower.includes('json') && lower.includes('nd')) return 'NDJSON'
  if (lower.includes('json')) return 'JSON'
  if (lower.includes('zip')) return 'ZIP'
  if (lower.includes('parquet')) return 'Parquet'
  if (lower.includes('excel') || lower.includes('sheet')) return 'XLSX'
  return value.toUpperCase()
}

function formatTone(index: number, label: string) {
  if (label === 'JSON') return 'var(--signal-teal)'
  if (label === 'Parquet') return 'var(--signal-purple)'
  if (label === 'NDJSON') return 'var(--signal-yellow)'
  if (label === 'XLSX') return 'var(--signal-orange)'
  return index === 0 ? 'var(--signal-blue)' : 'var(--text-faint)'
}

function statusTone(status: string) {
  if (status === 'healthy' || status === 'live') return 'dash-pill--done'
  if (status === 'degraded') return 'dash-pill--quarantine'
  if (status === 'unhealthy' || status === 'failed' || status === 'error') return 'dash-pill--failed'
  return 'dash-pill--neutral'
}

function jobTone(status: string) {
  if (status === 'completed') return 'completed'
  if (status === 'failed') return 'failed'
  if (status === 'quarantined' || status === 'quarantined_with_warnings') return 'quarantined'
  return 'processing'
}

function eventTone(severity: AnalyticsDashboardEvent['severity']) {
  if (severity === 'error') return 'error'
  if (severity === 'warning') return 'warn'
  return 'ok'
}

function progressForStatus(status: string) {
  if (status === 'completed' || status === 'quarantined' || status === 'quarantined_with_warnings') return 100
  if (status === 'failed') return 34
  if (status === 'pending' || status === 'queued') return 8
  return 67
}

function fileExtension(value: string) {
  const ext = value.split('.').pop()
  return ext && ext !== value ? ext.slice(0, 4).toLowerCase() : 'job'
}

function relativeDuration(start: string | null, end: string | null) {
  if (!start || !end) return '--'
  const started = new Date(start).getTime()
  const finished = new Date(end).getTime()
  if (Number.isNaN(started) || Number.isNaN(finished) || finished < started) return '--'
  const seconds = Math.round((finished - started) / 1000)
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`
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

function numeric(...values: Array<number | null | undefined>) {
  return values.find((value): value is number => typeof value === 'number' && Number.isFinite(value)) ?? 0
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0)
}

function bytesToGb(value: number) {
  return Math.round((value / 1024 / 1024 / 1024) * 10) / 10
}

function humanBytes(value: number) {
  if (value >= 1024 * 1024 * 1024) return `${formatDecimal(value / 1024 / 1024 / 1024)} GB`
  if (value >= 1024 * 1024) return `${formatDecimal(value / 1024 / 1024)} MB`
  if (value >= 1024) return `${formatDecimal(value / 1024)} KB`
  return `${formatNumber(value)} B`
}
