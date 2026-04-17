import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { OperationalStateBlock, OperationalToolbar, statusPillClass } from '@/components/app/operational-readout'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'
import { useAuth } from '@/features/auth/auth-context'
import { formatDateTime, formatNumber, humanizeOperationalError } from '@/lib/operational-utils'
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

export function DashboardPage() {
  const { session } = useAuth()
  const isAdmin = session?.user.role === 'admin'
  const [reloadToken, setReloadToken] = useState(0)
  const [viewState, setViewState] = useState<DashboardViewState>(INITIAL_STATE)

  useEffect(() => {
    let active = true

    async function loadOverview() {
      setViewState((current) => ({ ...current, status: 'loading', errorMessage: null }))

      try {
        const analyticsPromise = streamgateApi.getAnalytics({ preset: 'last_7d', timezone: 'UTC' })
        const jobsPromise = streamgateApi.listJobs({ page: 1, per_page: 5 })
        const uploadsPromise = streamgateApi.listUploads({ page: 1, per_page: 5 })
        const quarantinePromise = streamgateApi.listQuarantine({ preset: 'last_7d', page: 1, per_page: 5, sort_by: 'created_at', sort_order: 'desc' })
        const auditPromise = isAdmin
          ? streamgateApi.listAuditEvents({ preset: 'last_7d', page: 1, per_page: 5, sort_by: 'occurred_at', sort_order: 'desc' })
          : Promise.resolve({ data: [] })
        const dlqPromise = isAdmin
          ? streamgateApi.listQuarantineDlq({ page: 1, per_page: 5, sort_by: 'retry_count', sort_order: 'desc' })
          : Promise.resolve({ data: [] })

        const [analyticsResponse, jobsResponse, uploadsResponse, quarantineResponse, auditResponse, dlqResponse] = await Promise.all([
          analyticsPromise,
          jobsPromise,
          uploadsPromise,
          quarantinePromise,
          auditPromise,
          dlqPromise,
        ])

        if (!active) return

        const hasData = analyticsResponse.data || jobsResponse.data.length > 0 || quarantineResponse.data.length > 0

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
          errorMessage: humanizeOperationalError(error, 'Nao foi possivel carregar o command center.'),
          lastUpdatedAt: new Date(),
        }))
      }
    }

    loadOverview()

    return () => {
      active = false
    }
  }, [isAdmin, reloadToken])

  const kpis = viewState.analytics?.kpis
  const commandMetrics = useMemo(() => {
    if (!kpis) return []

    return [
      { label: 'Jobs totais', value: kpis.jobs_total, hint: 'janela last_7d' },
      { label: 'Processando', value: kpis.jobs_processing, hint: 'jobs ativos' },
      { label: 'Falhos', value: kpis.jobs_failed, hint: 'exigem investigacao' },
      { label: 'Quarentena', value: kpis.quarantine_records_total, hint: 'registros bloqueados' },
    ]
  }, [kpis])

  return (
    <WorkspacePageFrame pathname="/dashboard" eyebrow="Visao geral do sistema" title="Dashboard Operacional" primaryActionLabel="Recarregar">
      <div className="dash-content dash-content--module">
        <div className="dash-module-shell">
          <section className="dash-panel dash-module-card">
            <div className="dash-panel-head">
              <div>
                <div className="dash-panel-title">Command Center Operacional</div>
                <div className="dash-module-copy">
                  Visao real do backend Sprint 4: analytics, jobs, uploads, quarentena, auditoria e DLQ quando o usuario e admin.
                </div>
              </div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">last_7d</span>
                <span className="dash-panel-tag">UTC</span>
              </div>
            </div>
            <OperationalToolbar
              lastUpdatedAt={viewState.lastUpdatedAt}
              onRefresh={() => setReloadToken((current) => current + 1)}
            />
          </section>

          <section className="dash-panel dash-module-card">
            <OperationalStateBlock
              status={viewState.status}
              errorMessage={viewState.errorMessage}
              emptyMessage="Nenhum dado operacional retornado para o command center."
            >
              <div className="dash-module-grid">
                {commandMetrics.map((metric) => (
                  <div key={metric.label} className="dash-module-card">
                    <div className="dash-module-label">{metric.label}</div>
                    <div className="dash-module-value">{formatNumber(metric.value)}</div>
                    <div className="dash-module-hint">{metric.hint}</div>
                  </div>
                ))}
              </div>
            </OperationalStateBlock>
          </section>

          <div className="dash-grid-2">
            <section className="dash-panel">
              <div className="dash-panel-head">
                <div className="dash-panel-title">Jobs recentes</div>
                <div className="dash-panel-right"><Link className="dash-panel-tag" to="/jobs">abrir lista</Link></div>
              </div>
              <div className="dash-table-scroll">
                <table className="dash-table">
                  <thead><tr><th>Job</th><th>Status</th><th>Trace</th><th>Atualizado</th></tr></thead>
                  <tbody>
                    {viewState.jobs.map((job) => (
                      <tr key={job.id}>
                        <td><Link className="name" to={`/jobs/${job.id}`}>{job.id}</Link></td>
                        <td><span className={statusPillClass(job.status)}>{job.status}</span></td>
                        <td className="dim">{job.trace_id}</td>
                        <td className="dim">{formatDateTime(job.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="dash-panel">
              <div className="dash-panel-head">
                <div className="dash-panel-title">Quarentena recente</div>
                <div className="dash-panel-right"><Link className="dash-panel-tag" to="/quarantine">abrir triagem</Link></div>
              </div>
              <div className="dash-table-scroll">
                <table className="dash-table">
                  <thead><tr><th>Registro</th><th>Mensagem</th><th>Trace</th></tr></thead>
                  <tbody>
                    {viewState.quarantine.map((record) => (
                      <tr key={record.id}>
                        <td><Link className="name" to={`/quarantine/${record.id}`}>{record.id}</Link></td>
                        <td className="dim">{record.message}</td>
                        <td className="dim">{record.trace_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="dash-grid-2">
            <section className="dash-panel">
              <div className="dash-panel-head">
                <div className="dash-panel-title">Uploads recentes</div>
                <div className="dash-panel-right"><span className="dash-panel-tag">{viewState.uploads.length}</span></div>
              </div>
              <div className="dash-table-scroll">
                <table className="dash-table">
                  <thead><tr><th>Upload</th><th>Arquivo</th><th>Status</th></tr></thead>
                  <tbody>
                    {viewState.uploads.map((upload) => (
                      <tr key={upload.id}>
                        <td className="name">{upload.id}</td>
                        <td className="dim">{upload.filename}</td>
                        <td><span className={statusPillClass(upload.status)}>{upload.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="dash-panel">
              <div className="dash-panel-head">
                <div className="dash-panel-title">{isAdmin ? 'Auditoria e DLQ' : 'Saude operacional'}</div>
                <div className="dash-panel-right"><span className="dash-panel-tag">{isAdmin ? 'admin-only' : 'operator-safe'}</span></div>
              </div>
              <div className="dash-table-scroll">
                <table className="dash-table">
                  <thead><tr><th>Fonte</th><th>Sinal</th><th>Contexto</th></tr></thead>
                  <tbody>
                    {viewState.audit.map((event) => (
                      <tr key={event.id}>
                        <td><Link className="name" to={`/audit/${event.id}`}>audit</Link></td>
                        <td className="dim">{event.action}</td>
                        <td className="dim">{event.request_id}</td>
                      </tr>
                    ))}
                    {viewState.dlq.map((message, index) => (
                      <tr key={`${message.routing_key}-${index}`}>
                        <td><Link className="name" to={`/quarantine/dlq/${index}`}>dlq</Link></td>
                        <td className="dim">{message.dead_letter_reason ?? '--'}</td>
                        <td className="dim">{message.routing_key}</td>
                      </tr>
                    ))}
                    {!isAdmin ? (
                      <tr>
                        <td className="name">audit/dlq</td>
                        <td className="dim">restrito</td>
                        <td className="dim">somente admin</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </WorkspacePageFrame>
  )
}
