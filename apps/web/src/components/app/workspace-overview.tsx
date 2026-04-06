import {
  eventRows,
  formatRows,
  heatmapLabels,
  heatmapRows,
  jobs,
  kpis,
  queue,
  uploads,
  workers,
} from '@/components/app/dashboard-data'
import { DistributionDonut, VolumeChart, WeeklyBars } from '@/components/app/dashboard-graphics'

function statusPillClass(tone: string) {
  if (tone === 'completed') return 'dash-pill dash-pill--done'
  if (tone === 'failed') return 'dash-pill dash-pill--failed'
  if (tone === 'quarantined') return 'dash-pill dash-pill--quarantine'
  if (tone === 'idle') return 'dash-pill dash-pill--neutral'
  return 'dash-pill dash-pill--processing'
}

export function WorkspaceOverview() {
  return (
    <div className="dash-content">
      <div className="dash-kpi-strip">
        {kpis.map((item) => (
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
        <div className="dash-panel">
          <div className="dash-panel-head">
            <div className="dash-panel-title">Volume Processado - ultimas 24h</div>
            <div className="dash-panel-right">
              <span className="dash-panel-tag">ClickHouse</span>
              <span className="dash-panel-sub">atualizado ha 42s</span>
            </div>
          </div>
          <div className="dash-metric-block">
            <div className="dash-metric-cell"><div className="dash-metric-value blue">1.84 M</div><div className="dash-metric-label">Registros</div></div>
            <div className="dash-metric-cell"><div className="dash-metric-value teal">3.2 GB</div><div className="dash-metric-label">Ingerido</div></div>
            <div className="dash-metric-cell"><div className="dash-metric-value red">43</div><div className="dash-metric-label">Quarentena</div></div>
            <div className="dash-metric-cell"><div className="dash-metric-value green">98.9%</div><div className="dash-metric-label">Idempotencia</div></div>
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
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head">
            <div className="dash-panel-title">Pipeline de Jobs</div>
            <div className="dash-panel-right"><span className="dash-panel-tag">RabbitMQ</span></div>
          </div>
          <div className="dash-tabs">
            <div className="dash-tab active">Ativos (9)</div>
            <div className="dash-tab">Fila (3)</div>
            <div className="dash-tab">Historico</div>
          </div>
          <div className="dash-table-scroll">
            <table className="dash-table">
              <thead><tr><th>ID</th><th>Arquivo</th><th>Prog.</th><th>Dur.</th><th>Status</th></tr></thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td className="dim">{job.id}</td>
                    <td><div className="dash-file-cell"><span className="dash-file-ext">{job.ext}</span><span className="name">{job.file}</span></div></td>
                    <td><div className="dash-progress"><div className={`dash-progress-bar ${job.animated ? 'animated' : ''} ${job.tone}`} style={{ width: job.progress }} /></div></td>
                    <td className="dim">{job.duration}</td>
                    <td><span className={statusPillClass(job.tone)}>{job.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="dash-grid-4">
        <div className="dash-panel">
          <div className="dash-panel-head"><div className="dash-panel-title">Distribuicao</div><div className="dash-panel-right"><span className="dash-panel-tag">hoje</span></div></div>
          <div className="dash-donut-wrap">
            <DistributionDonut />
            <div className="dash-legend">
              <div className="dash-legend-row"><div className="dot green" />Concluidos<span className="value">131<span className="pct"> 88%</span></span></div>
              <div className="dash-legend-row"><div className="dot blue" />Em processo<span className="value">9<span className="pct"> 6%</span></span></div>
              <div className="dash-legend-row"><div className="dot red" />Falhos<span className="value">8<span className="pct"> 5%</span></span></div>
              <div className="dash-legend-row"><div className="dot purple" />Quarentena<span className="value">7<span className="pct"> 5%</span></span></div>
              <div className="dash-legend-row"><div className="dot gray" />Pendentes<span className="value">3<span className="pct"> 2%</span></span></div>
            </div>
          </div>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head"><div className="dash-panel-title">Por Formato</div><div className="dash-panel-right"><span className="dash-panel-tag">semana</span></div></div>
          <div className="dash-table-scroll dash-table-scroll--tight">
            <table className="dash-table">
              <thead><tr><th>Formato</th><th>Jobs</th><th>Volume</th><th>%</th></tr></thead>
              <tbody>
                {formatRows.map((row) => (
                  <tr key={row.label}>
                    <td className="name">{row.label}</td>
                    <td className="dim">{row.jobs}</td>
                    <td><div className="dash-rank-track"><div className="dash-rank-fill" style={{ width: row.width, background: row.tone }} /></div></td>
                    <td className="dim">{row.pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="dash-mini-chart">
            <div className="dash-mini-chart-label">Jobs/dia - semana atual</div>
            <WeeklyBars />
          </div>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head"><div className="dash-panel-title">Throughput - Heatmap</div><div className="dash-panel-right"><span className="dash-panel-tag">7 dias</span></div></div>
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
            <div className="dash-heatmap-days">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((day) => <span key={day}>{day}</span>)}</div>
            <div className="dash-heatmap-legend"><span>Baixo</span><div className="dash-heatmap-grad" /><span>Alto</span></div>
          </div>
        </div>

        <div className="dash-stack">
          <div className="dash-panel">
            <div className="dash-panel-head"><div className="dash-panel-title">Ingestao</div><div className="dash-panel-right"><span className="dash-panel-tag">MinIO</span></div></div>
            <div className="dash-panel-body">
              <div className="dash-upload-zone">
                <div className="dash-upload-icon">Upload</div>
                <div className="dash-upload-title">Arrastar arquivo</div>
                <div className="dash-upload-sub">URL assinada - ate 10 GB</div>
                <div className="dash-upload-formats">{['CSV', 'JSON', 'Parquet', 'NDJSON'].map((format) => <span key={format} className="dash-upload-format">{format}</span>)}</div>
              </div>
              <div className="dash-upload-progress">
                <div className="dash-upload-progress-title">Em progresso</div>
                {uploads.map((upload) => (
                  <div key={upload.name} className="dash-upload-item">
                    <div className="dash-upload-item-top"><span className="dash-upload-name">{upload.name}</span><span className="dash-upload-pct">{upload.pct}</span></div>
                    <div className="dash-progress"><div className={`dash-progress-bar ${upload.animated ? 'animated' : ''} ${upload.width === '100%' ? 'completed' : 'processing'}`} style={{ width: upload.width }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dash-panel dash-panel--fill">
            <div className="dash-panel-head"><div className="dash-panel-title">Fila</div><div className="dash-panel-right"><span className="dash-panel-sub">3 msgs</span></div></div>
            <div className="dash-queue-list">
              {queue.map((item) => (
                <div key={item.pos} className="dash-queue-item">
                  <div className="dash-queue-pos">{item.pos}</div>
                  <div className="dash-queue-name">{item.name}</div>
                  <div className="dash-queue-size">{item.size}</div>
                  <div className="dash-queue-eta">{item.eta}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dash-grid-3b">
        <div className="dash-panel">
          <div className="dash-panel-head"><div className="dash-panel-title">Event Log</div><div className="dash-panel-right"><span className="dash-panel-tag">ao vivo</span></div></div>
          <div className="dash-event-log">
            {eventRows.map((row) => (
              <div key={`${row.time}-${row.tag}`} className="dash-event">
                <span className="dash-event-time">{row.time}</span>
                <span className={`dash-event-tag ${row.tone}`}>{row.tag}</span>
                <span className="dash-event-msg">{row.msg}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head"><div className="dash-panel-title">Workers</div><div className="dash-panel-right"><span className="dash-panel-tag">4 ativos</span></div></div>
          <div className="dash-worker-list">
            {workers.map((worker) => (
              <div key={worker.name} className={`dash-worker ${worker.active ? '' : 'idle'}`}>
                <div className="dash-worker-top">
                  <div className={`dash-worker-dot ${worker.active ? 'on' : 'off'}`} style={{ animationDelay: worker.delay }} />
                  <span className="dash-worker-name">{worker.name}</span>
                  <span className={statusPillClass(worker.tone)}>{worker.badge}</span>
                </div>
                <div className="dash-worker-job">{worker.job}</div>
                {worker.active ? <div className="dash-progress"><div className="dash-progress-bar animated processing" style={{ width: worker.width }} /></div> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
