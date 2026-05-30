import { useId, useState } from 'react'
import { Link } from 'react-router-dom'

import { DistributionDonut, VolumeChart, WeeklyBars } from '@/features/dashboard/components/dashboard-graphics'
import {
  buildDashboardPreviewModel,
  type DashboardCommandCenterModel,
  type DashboardDetailTarget,
  type DashboardExportKind,
} from '@/lib/dashboard-command-center'
import type { DashboardRealtimeState } from '@/lib/dashboard-realtime'

type QuickUploadState = {
  state: 'idle' | 'signing' | 'uploading' | 'confirming' | 'requesting_link' | 'success' | 'error'
  message: string
}

export function WorkspaceOverview({
  model = buildDashboardPreviewModel(),
  onExport,
  onQuickUploadFile,
  quickUploadState = { state: 'idle', message: 'Aguardando arquivo.' },
  realtime,
  publicLinkValue = '',
  publicLinkBusy = false,
  onPublicLinkChange,
  onPublicLinkSubmit,
}: {
  model?: DashboardCommandCenterModel
  onExport?: (kind: DashboardExportKind, format: 'csv' | 'json') => void
  onQuickUploadFile?: (file: File) => void
  quickUploadState?: QuickUploadState
  realtime?: DashboardRealtimeState
  publicLinkValue?: string
  publicLinkBusy?: boolean
  onPublicLinkChange?: (value: string) => void
  onPublicLinkSubmit?: () => void
}) {
  const [activeTab, setActiveTab] = useState<keyof DashboardCommandCenterModel['jobsBoard']['tabs']>('active')
  const [detail, setDetail] = useState<DashboardDetailTarget | null>(null)
  const uploadInputId = useId()
  const currentJobs = model.jobsBoard.tabs[activeTab].rows
  const canExport = onExport && !model.exports.snapshot.disabled

  return (
    <div className="dash-content">
      <div className="dash-command-toolbar" aria-label="Acoes da dashboard">
        <div>
          <div className="dash-toolbar-label">{model.demoState === 'demo-preview' ? 'demo-preview' : 'data-driven'}</div>
          <div className="dash-toolbar-copy">{model.sourceLabel} · {model.lastUpdatedLabel}</div>
          {realtime ? <div className="dash-toolbar-copy">Realtime: {realtime.status} · {realtime.detail}</div> : null}
        </div>
        <div className="dash-toolbar-actions">
          <button type="button" className="dash-btn" disabled={!canExport} onClick={() => onExport?.('snapshot', 'csv')}>
            Exportar CSV
          </button>
          <button type="button" className="dash-btn" disabled={!canExport} onClick={() => onExport?.('event_log', 'json')}>
            Exportar JSON
          </button>
        </div>
      </div>

      <div className="dash-kpi-strip">
        {model.kpis.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`dash-kpi ${item.className}`}
            onClick={() => setDetail(item.detail)}
            aria-label={`${item.label} ${item.value}`}
          >
            <div className="dash-kpi-label">{item.label}</div>
            <div className="dash-kpi-value">{item.value}</div>
            <div className="dash-kpi-foot">
              <span className="dash-kpi-sub">{item.sub}</span>
              <span className={`dash-kpi-tag dash-kpi-tag--${item.tagTone}`}>{item.tag}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="dash-grid-2">
        <section className="dash-panel">
          <div className="dash-panel-head">
            <div className="dash-panel-title">Volume Processado - ultimas 24h</div>
            <div className="dash-panel-right">
              <span className="dash-panel-tag">{model.sourceLabel}</span>
              <button type="button" className="dash-panel-tag dash-panel-action" onClick={() => setDetail(model.timeseries24h.detail)}>
                {model.timeseries24h.status}
              </button>
            </div>
          </div>
          <div className="dash-metric-block">
            {model.metrics.map((metric) => (
              <div key={metric.label} className="dash-metric-cell">
                <div className={`dash-metric-value ${metric.tone}`}>{metric.value}</div>
                <div className="dash-metric-label">{metric.label}</div>
              </div>
            ))}
          </div>
          <div className="dash-chart-wrap">
            <VolumeChart points={model.timeseries24h.points} status={model.timeseries24h.status} />
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
            <div className="dash-panel-right"><span className="dash-panel-tag">{model.jobsBoard.status}</span></div>
          </div>
          <div className="dash-tabs" role="tablist" aria-label="Pipeline de jobs">
            {(Object.entries(model.jobsBoard.tabs) as Array<[keyof DashboardCommandCenterModel['jobsBoard']['tabs'], { label: string }]>).map(([key, tab]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeTab === key}
                className={`dash-tab ${activeTab === key ? 'active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {currentJobs.length > 0 ? (
            <div className="dash-table-scroll">
              <table className="dash-table">
                <thead><tr><th>ID</th><th>Arquivo</th><th>Prog.</th><th>Dur.</th><th>Status</th></tr></thead>
                <tbody>
                  {currentJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="dim"><button type="button" className="dash-link-button" onClick={() => setDetail(job.detail)}>{shortJobId(job.id)}</button></td>
                      <td><div className="dash-file-cell"><span className="dash-file-ext">{job.ext}</span><span className="name">{job.file}</span></div></td>
                      <td><div className="dash-progress"><div className={`dash-progress-bar ${job.tone === 'processing' ? 'animated' : ''} ${job.tone}`} style={{ width: `${job.progress}%` }} /></div></td>
                      <td className="dim">{job.duration}</td>
                      <td><span className={statusPillClass(job.tone)}>{job.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dash-module-note">{model.jobsBoard.emptyState}</div>
          )}
        </section>
      </div>

      <div className="dash-grid-4">
        <section className="dash-panel">
          <div className="dash-panel-head"><div className="dash-panel-title">Distribuicao</div><div className="dash-panel-right"><button type="button" className="dash-panel-tag dash-panel-action" onClick={() => setDetail(model.statusDistribution.detail)}>{model.statusDistribution.status}</button></div></div>
          <div className="dash-donut-wrap">
            <DistributionDonut rows={model.statusDistribution.rows} total={model.statusDistribution.total} />
            <div className="dash-legend">
              {model.statusDistribution.rows.map((row) => (
                <div key={row.status} className="dash-legend-row">
                  <div className="dot" style={{ background: row.tone }} />{humanStatus(row.status)}
                  <span className="value">{row.count}<span className="pct"> {row.percent}%</span></span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dash-panel">
          <div className="dash-panel-head"><div className="dash-panel-title">Por Formato</div><div className="dash-panel-right"><span className="dash-panel-tag">{model.formats.status}</span></div></div>
          {model.formats.rows.length > 0 ? (
            <div className="dash-table-scroll dash-table-scroll--tight">
              <table className="dash-table">
                <thead><tr><th>Formato</th><th>Jobs</th><th>Volume</th><th>%</th></tr></thead>
                <tbody>
                  {model.formats.rows.map((row) => (
                    <tr key={row.label}>
                      <td className="name"><button type="button" className="dash-link-button" onClick={() => setDetail(row.detail)}>{row.label}</button></td>
                      <td className="dim">{row.jobs}</td>
                      <td><div className="dash-rank-track"><div className="dash-rank-fill" style={{ width: row.width, background: row.tone }} /></div></td>
                      <td className="dim">{row.percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dash-module-note">{model.formats.emptyState}</div>
          )}
          <div className="dash-mini-chart">
            <div className="dash-mini-chart-label">Jobs/dia - semana atual</div>
            <WeeklyBars bars={model.formats.weeklyBars} />
          </div>
        </section>

        <section className="dash-panel">
          <div className="dash-panel-head"><div className="dash-panel-title">Throughput - Heatmap</div><div className="dash-panel-right"><button type="button" className="dash-panel-tag dash-panel-action" onClick={() => setDetail(model.heatmap7d.detail)}>{model.heatmap7d.status}</button></div></div>
          <div className="dash-heatmap-wrap">
            <div className="dash-heatmap-subtitle">Registros/hora por bloco e dia</div>
            <div className="dash-heatmap-grid">
              {model.heatmap7d.rows.map((row) => (
                <div key={row.range} className="dash-heatmap-row">
                  <span className="dash-heatmap-range">{row.range}</span>
                  {row.cells.map((cell, cellIndex) => (
                    <button
                      key={`${row.range}-${cellIndex}`}
                      type="button"
                      className="dash-heatmap-cell"
                      aria-label={cell.label}
                      style={{ background: heatmapColor(cell.intensity, model.heatmap7d.status) }}
                      onClick={() => setDetail(model.heatmap7d.detail)}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="dash-heatmap-days">{model.heatmap7d.days.map((day) => <span key={day}>{day}</span>)}</div>
            <div className="dash-heatmap-legend"><span>Baixo</span><div className="dash-heatmap-grad" /><span>Alto</span></div>
          </div>
        </section>

        <div className="dash-stack">
          <section className="dash-panel">
            <div className="dash-panel-head"><div className="dash-panel-title">Ingestao</div><div className="dash-panel-right"><span className="dash-panel-tag">{model.ingestion.status}</span></div></div>
            <div className="dash-panel-body">
              <label className="dash-upload-zone" htmlFor={uploadInputId}>
                <input
                  id={uploadInputId}
                  className="dash-sr-only"
                  type="file"
                  accept=".zip,.csv,.json,.ndjson,.jsonl,.xlsx,.parquet,text/csv,application/json,application/zip,application/x-ndjson,application/ndjson,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.apache.parquet"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0]
                    if (file) onQuickUploadFile?.(file)
                    event.currentTarget.value = ''
                  }}
                  disabled={!onQuickUploadFile || quickUploadState.state !== 'idle'}
                />
                <div className="dash-upload-icon">Upload</div>
                <div className="dash-upload-title">Arrastar arquivo</div>
                <div className="dash-upload-sub">URL assinada - ate 10 GB</div>
                <div className="dash-upload-formats">
                  {model.ingestion.formats.map((format) => <span key={format.label} className={`dash-upload-format ${format.state}`}>{format.label}</span>)}
                </div>
              </label>
              <div className={`dash-quick-upload-state ${quickUploadState.state}`}>{quickUploadState.message}</div>
              <div className="dash-public-link-row">
                <input
                  aria-label="Quick upload public link"
                  className="dash-public-link-input"
                  type="url"
                  placeholder="https://example.com/dataset.csv"
                  value={publicLinkValue}
                  onChange={(event) => onPublicLinkChange?.(event.target.value)}
                  disabled={!onPublicLinkSubmit || publicLinkBusy}
                />
                <button type="button" className="dash-btn" onClick={onPublicLinkSubmit} disabled={!onPublicLinkSubmit || publicLinkBusy || publicLinkValue.trim().length === 0}>
                  Link
                </button>
              </div>
              <div className="dash-upload-progress">
                <div className="dash-upload-progress-title">Em progresso</div>
                {model.ingestion.uploads.length > 0 ? model.ingestion.uploads.map((upload) => (
                  <button key={upload.id} type="button" className="dash-upload-item" onClick={() => setDetail(upload.detail)}>
                    <div className="dash-upload-item-top"><span className="dash-upload-name">{upload.name}</span><span className="dash-upload-pct">{upload.pct}</span></div>
                    <div className="dash-progress"><div className={`dash-progress-bar ${upload.progress < 100 ? 'animated processing' : 'completed'}`} style={{ width: `${upload.progress}%` }} /></div>
                  </button>
                )) : <div className="dash-module-note">{model.ingestion.emptyState}</div>}
              </div>
            </div>
          </section>

          <section className="dash-panel dash-panel--fill">
            <div className="dash-panel-head"><div className="dash-panel-title">Fila</div><div className="dash-panel-right"><button type="button" className="dash-panel-sub dash-panel-action" onClick={() => setDetail(model.queue.detail)}>{model.queue.rows.length} msgs</button></div></div>
            <div className="dash-queue-list">
              {model.queue.rows.length > 0 ? model.queue.rows.map((item) => (
                <button key={`${item.pos}-${item.name}`} type="button" className="dash-queue-item" onClick={() => setDetail(item.detail)}>
                  <div className="dash-queue-pos">{item.pos}</div>
                  <div className="dash-queue-name">{item.name}</div>
                  <div className="dash-queue-size">{item.size}</div>
                  <div className="dash-queue-eta">{item.eta}</div>
                </button>
              )) : <div className="dash-module-note">Fila sem mensagens para este snapshot.</div>}
            </div>
          </section>
        </div>
      </div>

      <div className="dash-grid-3b">
        <section className="dash-panel">
          <div className="dash-panel-head"><div className="dash-panel-title">Event Log</div><div className="dash-panel-right"><span className="dash-panel-tag">{model.eventLog.status}</span></div></div>
          {model.eventLog.rows.length > 0 ? (
            <div className="dash-event-log">
              {model.eventLog.rows.map((row) => (
                <button key={row.id} type="button" className="dash-event" onClick={() => setDetail(row.detail)}>
                  <span className="dash-event-time">{row.time}</span>
                  <span className={`dash-event-tag ${row.tone}`}>{row.tag}</span>
                  <span className="dash-event-msg">{row.msg}</span>
                </button>
              ))}
            </div>
          ) : <div className="dash-module-note">{model.eventLog.emptyState}</div>}
        </section>

        <section className="dash-panel">
          <div className="dash-panel-head"><div className="dash-panel-title">Workers</div><div className="dash-panel-right"><span className="dash-panel-tag">{model.workers.status}</span></div></div>
          <div className="dash-worker-list">
            {model.workers.rows.map((worker) => (
              <button key={worker.id} type="button" className={`dash-worker ${worker.active ? '' : 'idle'}`} onClick={() => setDetail(worker.detail)}>
                <div className="dash-worker-top">
                  <div className={`dash-worker-dot ${worker.active ? 'on' : 'off'}`} />
                  <span className="dash-worker-name">{worker.label}</span>
                  <span className={statusPillClass(worker.tone)}>{worker.badge}</span>
                </div>
                <div className="dash-worker-job">{worker.job}</div>
                {worker.active ? <div className="dash-progress"><div className="dash-progress-bar animated processing" style={{ width: `${worker.progress}%` }} /></div> : null}
              </button>
            ))}
          </div>
        </section>
      </div>

      {detail ? <DashboardDetailDrawer detail={detail} onClose={() => setDetail(null)} /> : null}
    </div>
  )
}

export function DashboardAlertStrip({
  model,
  role,
  onReview,
  onDismiss,
}: {
  model: DashboardCommandCenterModel
  role: 'operator' | 'admin' | 'service_account'
  onReview: (alertId: string, reason: string) => void
  onDismiss: (alertId: string, reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const alert = model.alerts.rows[0]
  const canDismiss = role === 'admin'
  const reasonReady = reason.trim().length >= 8

  if (!alert) {
    return (
      <div className="dash-alert-strip">
        <span className="dash-alert-icon">Alertas</span>
        <span><strong>Operacao segura</strong> {model.alerts.emptyState}</span>
        <span className="dash-alert-close">sem alerta</span>
      </div>
    )
  }

  return (
    <div className="dash-alert-strip">
      <span className="dash-alert-icon">Alertas</span>
      <span><strong>{alert.title}</strong> {alert.message}</span>
      <Link to={alert.href} className="dash-alert-link">Abrir triagem</Link>
      <span className="dash-alert-close">{alert.persistence}</span>
      <label className="dash-sr-only" htmlFor="dashboard-alert-reason">Motivo do alerta</label>
      <input
        id="dashboard-alert-reason"
        aria-label="Motivo do alerta"
        className="dash-public-link-input dash-alert-reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Motivo operacional"
      />
      <button type="button" className="dash-alert-close dash-alert-button" disabled={!reasonReady} onClick={() => onReview(alert.id, reason.trim())}>
        Revisar alerta
      </button>
      {canDismiss ? (
        <button type="button" className="dash-alert-close dash-alert-button" disabled={!reasonReady} onClick={() => onDismiss(alert.id, reason.trim())}>
          Dispensar alerta
        </button>
      ) : null}
    </div>
  )
}

function DashboardDetailDrawer({ detail, onClose }: { detail: DashboardDetailTarget; onClose: () => void }) {
  return (
    <div className="dash-drawer-shell" role="dialog" aria-modal="true" aria-labelledby="dash-detail-title">
      <button type="button" className="dash-drawer-backdrop" aria-label="Fechar detalhe" onClick={onClose} />
      <aside className="dash-drawer">
        <div className="dash-panel-head">
          <div>
            <div className="dash-panel-title" id="dash-detail-title">Detalhe contextual</div>
            <div className="dash-module-copy">{detail.subtitle}</div>
          </div>
          <button type="button" className="dash-btn" onClick={onClose}>Fechar painel</button>
        </div>
        <div className="dash-drawer-body">
          <h2>{detail.title}</h2>
          <MetricRows rows={detail.rows} />
          <Link className="dash-btn dash-btn--primary" to={detail.href}>Abrir rota especializada</Link>
        </div>
      </aside>
    </div>
  )
}

function MetricRows({ rows }: { rows: Array<[string, string | number]> }) {
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

function statusPillClass(tone: string) {
  if (tone === 'completed') return 'dash-pill dash-pill--done'
  if (tone === 'failed') return 'dash-pill dash-pill--failed'
  if (tone === 'quarantined') return 'dash-pill dash-pill--quarantine'
  if (tone === 'idle') return 'dash-pill dash-pill--neutral'
  return 'dash-pill dash-pill--processing'
}

function shortJobId(id: string) {
  return id.startsWith('job_') ? id.slice(0, 12) : id
}

function humanStatus(status: string) {
  if (status === 'completed') return 'Concluidos'
  if (status === 'processing') return 'Em processo'
  if (status === 'failed') return 'Falhos'
  if (status === 'quarantined' || status === 'quarantined_with_warnings') return 'Quarentena'
  if (status === 'pending') return 'Pendentes'
  return status
}

function heatmapColor(intensity: number, status: string) {
  if (status === 'backend-pending') {
    return 'rgba(77,157,224,.06)'
  }

  if (intensity > 0.72) return 'rgba(60,207,207,.78)'
  if (intensity > 0.48) return 'rgba(77,157,224,.58)'
  if (intensity > 0.24) return 'rgba(77,157,224,.32)'
  if (intensity > 0.08) return 'rgba(77,157,224,.14)'
  return 'rgba(77,157,224,.04)'
}
