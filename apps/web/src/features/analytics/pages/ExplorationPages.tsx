import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { WorkspacePageFrame } from '@/features/dashboard/components/workspace-page-frame'
import { formatDateTime, formatNumber, humanizeOperationalError } from '@/lib/operational-utils'
import {
  streamgateApi,
  type AnalyticsLineage,
  type AnalyticsWarehouseSnapshot,
  type JobSummary,
} from '@/lib/streamgate-api'

type AsyncState<T> = {
  status: 'loading' | 'success' | 'empty' | 'error'
  data: T | null
  errorMessage: string | null
}

const INITIAL_WAREHOUSE_STATE: AsyncState<AnalyticsWarehouseSnapshot> = {
  status: 'loading',
  data: null,
  errorMessage: null,
}

const INITIAL_LINEAGE_STATE: AsyncState<AnalyticsLineage> = {
  status: 'loading',
  data: null,
  errorMessage: null,
}

export function ClickHousePage() {
  const [state, setState] = useState<AsyncState<AnalyticsWarehouseSnapshot>>(INITIAL_WAREHOUSE_STATE)

  useEffect(() => {
    let active = true

    async function loadWarehouse() {
      setState((current) => ({ ...current, status: 'loading', errorMessage: null }))

      try {
        const response = await streamgateApi.getAnalyticsWarehouse({ preset: 'last_24h', timezone: 'UTC' })
        if (!active) return

        setState({
          status: response.data ? 'success' : 'empty',
          data: response.data,
          errorMessage: null,
        })
      } catch (error) {
        if (!active) return

        setState({
          status: 'error',
          data: null,
          errorMessage: humanizeOperationalError(error, 'Nao foi possivel carregar o warehouse operacional.'),
        })
      }
    }

    loadWarehouse()

    return () => {
      active = false
    }
  }, [])

  const model = useMemo(() => buildWarehouseModel(state.data), [state.data])

  return (
    <WorkspacePageFrame pathname="/clickhouse" eyebrow="Exploracao analitica" title="ClickHouse" secondaryActionLabel={null}>
      <div className="dash-content dash-content--module">
        <section className="dash-panel">
          <div className="dash-panel-head">
            <div>
              <div className="dash-panel-title">Warehouse operacional</div>
              <div className="dash-module-copy">
                Leitura analitica fechada para operacao: fonte, fallback, lag, SLO e agregados sem consulta livre.
              </div>
            </div>
            <div className="dash-panel-right">
              <span className="dash-panel-tag">Fonte: {model.source}</span>
              <span className="dash-panel-tag">{model.staleLabel}</span>
            </div>
          </div>

          {state.status === 'error' ? <div className="dash-module-note">{state.errorMessage}</div> : null}

          <div className="dash-module-grid">
            {model.kpis.map((metric) => (
              <div key={metric.label} className="dash-module-card">
                <div className="dash-module-label">{metric.label}</div>
                <div className="dash-module-value">{metric.value}</div>
                <div className="dash-module-hint">{metric.hint}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="dash-grid-2">
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Dependencias</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">{model.fallbackReason}</span>
              </div>
            </div>
            <SimpleTable headers={['Dependencia', 'Status']} rows={model.dependencies} emptyState="Nenhuma dependencia reportada." />
          </section>

          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Agregados por origem</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">records</span>
              </div>
            </div>
            <SimpleTable headers={['Origem', 'Total']} rows={model.bySource} emptyState="Nenhuma origem agregada nesta janela." />
          </section>
        </div>

        <div className="dash-grid-2">
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Agregados por status</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">jobs</span>
              </div>
            </div>
            <SimpleTable headers={['Status', 'Total']} rows={model.byStatus} emptyState="Nenhum status agregado nesta janela." />
          </section>

          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Janela e SLO</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">generated {formatDateTime(state.data?.generated_at)}</span>
              </div>
            </div>
            <SimpleTable headers={['Campo', 'Valor']} rows={model.sloRows} />
          </section>
        </div>
      </div>
    </WorkspacePageFrame>
  )
}

export function EtlExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedJobId = (searchParams.get('job_id') ?? '').trim()
  const [jobs, setJobs] = useState<JobSummary[]>([])
  const [lineageState, setLineageState] = useState<AsyncState<AnalyticsLineage>>(INITIAL_LINEAGE_STATE)

  useEffect(() => {
    let active = true

    async function loadRecentJobs() {
      try {
        const response = await streamgateApi.listJobs({ page: 1, per_page: 10 })
        if (!active) return

        const rows = Array.isArray(response.data) ? response.data : []
        setJobs(rows)

        if (!selectedJobId && rows[0]?.id) {
          setSearchParams({ job_id: rows[0].id }, { replace: true })
        }
      } catch {
        if (!active) return
        setJobs([])
      }
    }

    loadRecentJobs()

    return () => {
      active = false
    }
  }, [selectedJobId, setSearchParams])

  useEffect(() => {
    let active = true

    async function loadLineage() {
      if (!selectedJobId) {
        setLineageState({ status: 'empty', data: null, errorMessage: null })
        return
      }

      setLineageState((current) => ({ ...current, status: 'loading', errorMessage: null }))

      try {
        const response = await streamgateApi.getAnalyticsLineage(selectedJobId)
        if (!active) return

        setLineageState({
          status: response.data ? 'success' : 'empty',
          data: response.data,
          errorMessage: null,
        })
      } catch (error) {
        if (!active) return

        setLineageState({
          status: 'error',
          data: null,
          errorMessage: humanizeOperationalError(error, 'Nao foi possivel carregar lineage do job.'),
        })
      }
    }

    loadLineage()

    return () => {
      active = false
    }
  }, [selectedJobId])

  const model = useMemo(() => buildLineageModel(lineageState.data), [lineageState.data])

  return (
    <WorkspacePageFrame pathname="/etl-explorer" eyebrow="Fluxos e lineage" title="ETL Explorer" secondaryActionLabel={null}>
      <div className="dash-content dash-content--module">
        <section className="dash-panel">
          <div className="dash-panel-head">
            <div>
              <div className="dash-panel-title">Lineage real</div>
              <div className="dash-module-copy">
                Drilldown por job com upload, acquisition, batches, attempts, quarentena, artefatos, warnings e auditoria.
              </div>
            </div>
            <div className="dash-panel-right">
              <span className="dash-panel-tag">job {selectedJobId || '--'}</span>
              <Link className="dash-panel-tag" to="/jobs">jobs</Link>
            </div>
          </div>

          {lineageState.status === 'error' ? <div className="dash-module-note">{lineageState.errorMessage}</div> : null}

          <div className="dash-module-grid">
            {model.kpis.map((metric) => (
              <div key={metric.label} className="dash-module-card">
                <div className="dash-module-label">{metric.label}</div>
                <div className="dash-module-value text-base">{metric.value}</div>
                <div className="dash-module-hint">{metric.hint}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="dash-grid-2">
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Jobs recentes</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">{jobs.length} itens</span>
              </div>
            </div>
            <SimpleTable
              headers={['Job', 'Status']}
              rows={jobs.map((job) => [
                <button key={job.id} type="button" className="dash-panel-tag" onClick={() => setSearchParams({ job_id: job.id })}>
                  {job.id}
                </button>,
                job.status,
              ])}
              emptyState="Nenhum job recente para auto-selecao."
            />
          </section>

          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Upload e acquisition</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">{model.sourceType}</span>
              </div>
            </div>
            <SimpleTable headers={['Campo', 'Valor']} rows={model.contextRows} emptyState="Sem contexto de upload." />
          </section>
        </div>

        <div className="dash-grid-2">
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Batches</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">{model.batchRows.length} itens</span>
              </div>
            </div>
            <SimpleTable headers={['Batch', 'Status', 'Linhas']} rows={model.batchRows} emptyState="Nenhum batch reportado." />
          </section>

          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Attempts</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">{model.attemptRows.length} itens</span>
              </div>
            </div>
            <SimpleTable headers={['Attempt', 'Operacao', 'Status']} rows={model.attemptRows} emptyState="Nenhuma tentativa reportada." />
          </section>
        </div>

        <div className="dash-grid-2">
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Quarentena e warnings</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">{model.issueRows.length} itens</span>
              </div>
            </div>
            <SimpleTable headers={['Tipo', 'Mensagem', 'Status']} rows={model.issueRows} emptyState="Nenhum warning ou registro de quarentena." />
          </section>

          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Artifacts e auditoria</div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">{model.artifactRows.length + model.auditRows.length} refs</span>
              </div>
            </div>
            <SimpleTable headers={['Tipo', 'Referencia', 'Status']} rows={[...model.artifactRows, ...model.auditRows]} emptyState="Nenhum artefato ou audit ref." />
          </section>
        </div>
      </div>
    </WorkspacePageFrame>
  )
}

function SimpleTable({
  headers,
  rows,
  emptyState,
}: {
  headers: string[]
  rows: Array<Array<ReactNode>>
  emptyState?: string
}) {
  if (rows.length === 0) {
    return <div className="dash-module-note">{emptyState ?? 'Sem dados nesta janela.'}</div>
  }

  return (
    <div className="dash-table-scroll">
      <table className="dash-table">
        <thead>
          <tr>
            {headers.map((header) => <th key={header}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={cellIndex === 0 ? 'name' : 'dim'}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function buildWarehouseModel(snapshot: AnalyticsWarehouseSnapshot | null) {
  const aggregates = snapshot?.aggregates

  return {
    source: snapshot?.source ?? 'empty',
    staleLabel: snapshot?.stale ? 'stale' : 'fresh',
    fallbackReason: snapshot?.fallback_reason ?? 'sem fallback',
    kpis: [
      { label: 'Registros', value: formatNumber(aggregates?.records_total ?? 0), hint: 'validos + invalidos' },
      { label: 'Validos', value: formatNumber(aggregates?.valid_records ?? 0), hint: 'payload nao exposto' },
      { label: 'Invalidos', value: formatNumber(aggregates?.invalid_records ?? 0), hint: 'somente metadata/HMAC' },
      { label: 'Jobs', value: formatNumber(aggregates?.jobs_total ?? 0), hint: 'camada por job' },
      { label: 'Uploads', value: formatNumber(aggregates?.uploads_total ?? 0), hint: 'camada operacional' },
      { label: 'Lag', value: snapshot?.lag_seconds === null || snapshot?.lag_seconds === undefined ? '--' : `${snapshot.lag_seconds}s`, hint: `target ${snapshot?.slo_target_seconds ?? 0}s` },
    ],
    dependencies: Object.entries(snapshot?.dependency_status ?? {}).map(([name, status]) => [name, status]),
    bySource: Object.entries(aggregates?.by_source ?? {}).map(([source, count]) => [source, formatNumber(count)]),
    byStatus: Object.entries(aggregates?.by_status ?? {}).map(([status, count]) => [status, formatNumber(count)]),
    sloRows: [
      ['Ultimo evento', formatDateTime(snapshot?.last_event_at)],
      ['P95', `${formatNumber(snapshot?.p95_ms ?? 0)} ms`],
      ['Error budget', `${snapshot?.error_budget_percent ?? 0}%`],
      ['Fallback', snapshot?.fallback_reason ?? '--'],
    ],
  }
}

function buildLineageModel(lineage: AnalyticsLineage | null) {
  return {
    sourceType: lineage?.job.source_type ?? '--',
    kpis: [
      { label: 'Job', value: lineage?.job.id ?? '--', hint: lineage?.job.status ?? 'sem job selecionado' },
      { label: 'Upload', value: lineage?.upload.id ?? '--', hint: lineage?.upload.filename ?? 'sem upload' },
      { label: 'Batches', value: formatNumber(lineage?.batches.length ?? 0), hint: 'particoes processadas' },
      { label: 'Artifacts', value: formatNumber(lineage?.artifacts.length ?? 0), hint: 'arquivos derivados' },
    ],
    contextRows: [
      ['Job', lineage?.job.id ?? '--'],
      ['Upload', lineage?.upload.id ?? '--'],
      ['Arquivo', lineage?.upload.filename ?? '--'],
      ['Origem', lineage?.job.source_type ?? '--'],
      ['Link mascarado', lineage?.acquisition?.url_masked ?? '--'],
      ['Trace', lineage?.job.trace_id ?? '--'],
    ].filter(([, value]) => value !== '--'),
    batchRows: (lineage?.batches ?? []).map((batch) => [
      batch.id,
      batch.status,
      `${formatNumber(batch.valid_rows)}/${formatNumber(batch.input_rows)} validas`,
    ]),
    attemptRows: (lineage?.attempts ?? []).map((attempt) => [
      attempt.id,
      attempt.operation,
      attempt.status,
    ]),
    issueRows: [
      ...(lineage?.quarantine ?? []).map((record) => ['quarantine', record.message, record.resolution_status]),
      ...(lineage?.warnings ?? []).map((warning) => ['warning', warning.message, warning.status]),
    ],
    artifactRows: (lineage?.artifacts ?? []).map((artifact) => [
      artifact.artifact_type,
      artifact.filename,
      artifact.status,
    ]),
    auditRows: (lineage?.audit_refs ?? []).map((audit) => [
      audit.action,
      audit.id,
      audit.trace_id,
    ]),
  }
}
