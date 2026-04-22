import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  IdCopy,
  JsonPreview,
  OperationalStateBlock,
  OperationalToolbar,
  PaginationSummary,
} from '@/components/app/operational-readout'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'
import { ApiClientError } from '@/lib/api-client'
import { useAuth } from '@/features/auth/auth-context'
import { useOperationalQueryState } from '@/hooks/use-operational-query-state'
import { buildCsv, buildOperationalQuery, downloadCsv, formatDateTime, humanizeOperationalError } from '@/lib/operational-utils'
import { streamgateApi, type AuditEvent, type PaginationMeta } from '@/lib/streamgate-api'

type AuditViewState = {
  status: 'loading' | 'success' | 'empty' | 'error' | 'denied'
  events: AuditEvent[]
  pagination: PaginationMeta
  lastUpdatedAt: Date | null
  errorMessage: string | null
}

const EXTRA_KEYS = ['action', 'actor_id', 'auditable_type', 'trace_id', 'request_id']
const INITIAL_PAGINATION = { page: 1, per_page: 20, total_count: 0, total_pages: 0 }

export function AuditPage() {
  const { session } = useAuth()
  const isAdmin = session?.user.role === 'admin'
  const { query, queryKey } = useOperationalQueryState({ defaultSortBy: 'occurred_at', extraKeys: EXTRA_KEYS })
  const [reloadToken, setReloadToken] = useState(0)
  const [viewState, setViewState] = useState<AuditViewState>({
    status: isAdmin ? 'loading' : 'denied',
    events: [],
    pagination: INITIAL_PAGINATION,
    lastUpdatedAt: null,
    errorMessage: null,
  })

  useEffect(() => {
    if (!isAdmin) {
      setViewState((current) => ({ ...current, status: 'denied' }))
      return
    }

    let active = true

    async function loadAudit() {
      setViewState((current) => ({ ...current, status: 'loading', errorMessage: null }))

      try {
        const response = await streamgateApi.listAuditEvents(buildOperationalQuery(query))
        if (!active) return

        setViewState({
          status: response.data.length > 0 ? 'success' : 'empty',
          events: response.data,
          pagination: response.meta?.pagination ?? INITIAL_PAGINATION,
          lastUpdatedAt: new Date(),
          errorMessage: null,
        })
      } catch (error) {
        if (!active) return

        const denied = error instanceof ApiClientError && error.status === 403 && error.code === 'access_denied'

        setViewState((current) => ({
          ...current,
          status: denied ? 'denied' : 'error',
          errorMessage: denied
            ? 'Sem permissao para consultar a trilha completa de auditoria.'
            : humanizeOperationalError(error, 'Nao foi possivel carregar auditoria.'),
          lastUpdatedAt: new Date(),
        }))
      }
    }

    loadAudit()

    return () => {
      active = false
    }
  }, [isAdmin, query, queryKey, reloadToken])

  const csvRows = useMemo(
    () => viewState.events.map((event) => ({
      id: event.id,
      action: event.action,
      actor_id: event.actor_id,
      auditable_type: event.auditable_type,
      auditable_id: event.auditable_id,
      request_id: event.request_id,
      trace_id: event.trace_id,
      occurred_at: event.occurred_at,
    })),
    [viewState.events],
  )

  function exportCsv() {
    downloadCsv('streamgate-audit.csv', buildCsv(csvRows, ['id', 'action', 'actor_id', 'auditable_type', 'auditable_id', 'request_id', 'trace_id', 'occurred_at']))
  }

  return (
    <WorkspacePageFrame pathname="/audit" eyebrow="Governanca e trilha" title="Auditoria" primaryActionLabel="Recarregar">
      <div className="dash-content dash-content--module">
        <div className="dash-module-shell">
          <section className="dash-panel dash-module-card">
            <div className="dash-panel-head">
              <div>
                <div className="dash-panel-title">Auditoria operacional</div>
                <div className="dash-module-copy">
                  Trilha admin-only com action, actor_id, recurso, request_id, trace_id e metadata mascarada.
                </div>
              </div>
              <div className="dash-panel-right"><span className="dash-panel-tag">admin-only</span></div>
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
              emptyMessage="Nenhum evento de auditoria para os filtros atuais."
            >
              <div className="dash-table-scroll">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Acao</th>
                      <th>Ator</th>
                      <th>Recurso</th>
                      <th>Contexto</th>
                      <th>Quando</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewState.events.map((event) => (
                      <tr key={event.id}>
                        <td>
                          <Link className="name" to={`/audit/${event.id}`}>{event.action}</Link>
                          <div className="dim">{event.id}</div>
                        </td>
                        <td className="dim">{event.actor_id ?? '--'}</td>
                        <td>
                          <div className="name">{event.auditable_type}</div>
                          <div className="dim">{event.auditable_id}</div>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-2">
                            <IdCopy label="request_id" value={event.request_id} />
                            <IdCopy label="trace_id" value={event.trace_id} />
                          </div>
                          <JsonPreview value={event.metadata ?? {}} />
                        </td>
                        <td className="dim">{formatDateTime(event.occurred_at)}</td>
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
        </div>
      </div>
    </WorkspacePageFrame>
  )
}
