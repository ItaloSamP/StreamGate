import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  IdCopy,
  JsonPreview,
  OperationalStateBlock,
  OperationalToolbar,
  PaginationSummary,
  statusPillClass,
} from '@/components/app/operational-readout'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'
import { useAuth } from '@/features/auth/auth-context'
import { useOperationalQueryState } from '@/hooks/use-operational-query-state'
import { buildCsv, buildOperationalQuery, downloadCsv, formatDateTime, humanizeOperationalError } from '@/lib/operational-utils'
import { streamgateApi, type DlqMessage, type PaginationMeta, type QuarantineRecord } from '@/lib/streamgate-api'

type QuarantineViewState = {
  status: 'loading' | 'success' | 'empty' | 'error'
  records: QuarantineRecord[]
  dlq: DlqMessage[]
  pagination: PaginationMeta
  lastUpdatedAt: Date | null
  errorMessage: string | null
  dlqErrorMessage: string | null
}

const EXTRA_KEYS = ['severity', 'job_id', 'trace_id']
const INITIAL_PAGINATION = { page: 1, per_page: 20, total_count: 0, total_pages: 0 }

export function QuarantinePage() {
  const { session } = useAuth()
  const isAdmin = session?.user.role === 'admin'
  const { query, queryKey } = useOperationalQueryState({ defaultSortBy: 'created_at', extraKeys: EXTRA_KEYS })
  const [reloadToken, setReloadToken] = useState(0)
  const [viewState, setViewState] = useState<QuarantineViewState>({
    status: 'loading',
    records: [],
    dlq: [],
    pagination: INITIAL_PAGINATION,
    lastUpdatedAt: null,
    errorMessage: null,
    dlqErrorMessage: null,
  })

  useEffect(() => {
    let active = true

    async function loadQuarantine() {
      setViewState((current) => ({ ...current, status: 'loading', errorMessage: null, dlqErrorMessage: null }))

      try {
        const quarantinePromise = streamgateApi.listQuarantine(buildOperationalQuery(query))
        const dlqPromise = isAdmin ? streamgateApi.listQuarantineDlq(buildOperationalQuery(query)) : Promise.resolve({ data: [] })
        const [quarantineResponse, dlqResponse] = await Promise.allSettled([quarantinePromise, dlqPromise])

        if (!active) return

        if (quarantineResponse.status === 'rejected') {
          setViewState((current) => ({
            ...current,
            status: 'error',
            errorMessage: humanizeOperationalError(quarantineResponse.reason, 'Nao foi possivel carregar quarentena.'),
            lastUpdatedAt: new Date(),
          }))
          return
        }

        const records = quarantineResponse.value.data
        const dlq = dlqResponse.status === 'fulfilled' ? dlqResponse.value.data : []

        setViewState({
          status: records.length > 0 ? 'success' : 'empty',
          records,
          dlq,
          pagination: quarantineResponse.value.meta?.pagination ?? INITIAL_PAGINATION,
          lastUpdatedAt: new Date(),
          errorMessage: null,
          dlqErrorMessage: dlqResponse.status === 'rejected'
            ? humanizeOperationalError(dlqResponse.reason, 'DLQ indisponivel. Verifique RabbitMQ ou permissao admin.')
            : null,
        })
      } catch (error) {
        if (!active) return

        setViewState((current) => ({
          ...current,
          status: 'error',
          errorMessage: humanizeOperationalError(error, 'Nao foi possivel carregar quarentena.'),
          lastUpdatedAt: new Date(),
        }))
      }
    }

    loadQuarantine()

    return () => {
      active = false
    }
  }, [isAdmin, query, queryKey, reloadToken])

  const csvRows = useMemo(
    () => viewState.records.map((record) => ({
      id: record.id,
      job_id: record.job_id,
      severity: record.severity,
      code: record.code,
      message: record.message,
      trace_id: record.trace_id,
      created_at: record.created_at,
    })),
    [viewState.records],
  )

  function exportCsv() {
    downloadCsv('streamgate-quarantine.csv', buildCsv(csvRows, ['id', 'job_id', 'severity', 'code', 'message', 'trace_id', 'created_at']))
  }

  return (
    <WorkspacePageFrame pathname="/quarantine" eyebrow="Qualidade e triagem" title="Quarentena" primaryActionLabel="Recarregar">
      <div className="dash-content dash-content--module">
        <div className="dash-module-shell">
          <section className="dash-panel dash-module-card">
            <div className="dash-panel-head">
              <div>
                <div className="dash-panel-title">Quarentena operacional</div>
                <div className="dash-module-copy">
                  Registros reais bloqueados pelo worker, com payload mascarado, links de contexto e DLQ admin-only.
                </div>
              </div>
              <div className="dash-panel-right">
                <span className="dash-panel-tag">{query.preset}</span>
                <span className="dash-panel-tag">{query.sort_by}</span>
              </div>
            </div>
            <OperationalToolbar
              lastUpdatedAt={viewState.lastUpdatedAt}
              onRefresh={() => setReloadToken((current) => current + 1)}
              onExport={exportCsv}
              exportDisabled={csvRows.length === 0}
            />
          </section>

          <section className="dash-panel dash-module-card">
            <OperationalStateBlock
              status={viewState.status}
              errorMessage={viewState.errorMessage}
              emptyMessage="Nenhum registro em quarentena para os filtros atuais."
            >
              <div className="dash-table-scroll">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Registro</th>
                      <th>Mensagem</th>
                      <th>Severidade</th>
                      <th>Trace</th>
                      <th>Criado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewState.records.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <Link className="name" to={`/quarantine/${record.id}`}>{record.id}</Link>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <IdCopy label="job_id" value={record.job_id} />
                            <IdCopy label="trace_id" value={record.trace_id} />
                          </div>
                        </td>
                        <td>
                          <div className="name">{record.message}</div>
                          <div className="dim">{record.code} | linha {record.row_number ?? '--'}</div>
                          <JsonPreview value={record.payload ?? {}} />
                        </td>
                        <td><span className={statusPillClass(record.severity)}>{record.severity}</span></td>
                        <td className="dim">{record.trace_id}</td>
                        <td className="dim">{formatDateTime(record.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] px-4 py-3">
                <PaginationSummary
                  page={viewState.pagination.page}
                  totalPages={viewState.pagination.total_pages}
                  totalCount={viewState.pagination.total_count}
                />
              </div>
            </OperationalStateBlock>
          </section>

          {isAdmin ? (
            <section className="dash-panel dash-module-card">
              <div className="dash-panel-head">
                <div>
                  <div className="dash-panel-title">DLQ read-only</div>
                  <div className="dash-module-copy">Inspecao segura da dead-letter queue sem retry, replay ou ack operacional.</div>
                </div>
              </div>
              {viewState.dlqErrorMessage ? (
                <div className="p-4 text-mono text-[11px] text-[var(--signal-yellow)]">{viewState.dlqErrorMessage}</div>
              ) : null}
              <div className="dash-table-scroll">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Mensagem</th>
                      <th>Routing key</th>
                      <th>Retries</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewState.dlq.map((message, index) => (
                      <tr key={`${message.routing_key}-${index}`}>
                        <td><Link className="name" to={`/quarantine/dlq/${index}`}>dlq-{index + 1}</Link></td>
                        <td className="dim">{message.routing_key}</td>
                        <td>{message.retry_count}</td>
                        <td className="name">{message.dead_letter_reason ?? '--'}</td>
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
