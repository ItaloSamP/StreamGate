import { useEffect, useMemo, useState } from 'react'

import {
  IdCopy,
  JsonPreview,
  OperationalStateBlock,
  OperationalToolbar,
  PaginationSummary,
} from '@/components/app/operational-readout'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'
import { useOperationalQueryState } from '@/hooks/use-operational-query-state'
import { buildCsv, buildOperationalQuery, downloadCsv, formatDateTime, humanizeOperationalError } from '@/lib/operational-utils'
import { streamgateApi, type AuditEvent, type PaginationMeta } from '@/lib/streamgate-api'

type EventLogViewState = {
  status: 'loading' | 'success' | 'empty' | 'error' | 'denied'
  events: AuditEvent[]
  pagination: PaginationMeta
  lastUpdatedAt: Date | null
  errorMessage: string | null
}

const EXTRA_KEYS = ['action', 'actor_id', 'auditable_type', 'trace_id', 'request_id']
const INITIAL_PAGINATION = { page: 1, per_page: 20, total_count: 0, total_pages: 0 }

export function EventLogPage() {
  const { query, queryKey } = useOperationalQueryState({ defaultSortBy: 'occurred_at', extraKeys: EXTRA_KEYS })
  const [reloadToken, setReloadToken] = useState(0)
  const [viewState, setViewState] = useState<EventLogViewState>({
    status: 'loading',
    events: [],
    pagination: INITIAL_PAGINATION,
    lastUpdatedAt: null,
    errorMessage: null,
  })

  useEffect(() => {
    let active = true

    async function loadEvents() {
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

        setViewState((current) => ({
          ...current,
          status: 'error',
          errorMessage: humanizeOperationalError(error, 'Nao foi possivel carregar event log.'),
          lastUpdatedAt: new Date(),
        }))
      }
    }

    loadEvents()

    return () => {
      active = false
    }
  }, [query, queryKey, reloadToken])

  const csvRows = useMemo(
    () => viewState.events.map((event) => ({
      id: event.id,
      action: event.action,
      request_id: event.request_id,
      trace_id: event.trace_id,
      occurred_at: event.occurred_at,
    })),
    [viewState.events],
  )

  function exportCsv() {
    downloadCsv('streamgate-event-log.csv', buildCsv(csvRows, ['id', 'action', 'request_id', 'trace_id', 'occurred_at']))
  }

  return (
    <WorkspacePageFrame pathname="/events" eyebrow="Eventos do sistema" title="Event Log" primaryActionLabel="Recarregar">
      <div className="dash-content dash-content--module">
        <div className="dash-module-shell">
          <section className="dash-panel dash-module-card">
            <div className="dash-panel-head">
              <div>
                <div className="dash-panel-title">Event Log Operacional</div>
                <div className="dash-module-copy">
                  Timeline read-only alimentada por /audit nesta sprint, com request_id, trace_id e metadata segura.
                </div>
              </div>
              <div className="dash-panel-right"><span className="dash-panel-tag">audit-backed</span></div>
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
              emptyMessage="Nenhum evento retornado para esta janela."
            >
              <div className="dash-event-log p-4">
                {viewState.events.map((event) => (
                  <article key={event.id} className="dash-event">
                    <span className="dash-event-time">{formatDateTime(event.occurred_at)}</span>
                    <span className="dash-event-tag blue">{event.action}</span>
                    <span className="dash-event-msg">
                      {event.auditable_type}:{event.auditable_id}
                      <span className="ml-2 text-[var(--text-faint)]">{event.request_id}</span>
                    </span>
                    <span className="flex flex-wrap gap-2">
                      <IdCopy label="request_id" value={event.request_id} />
                      <IdCopy label="trace_id" value={event.trace_id} />
                    </span>
                    <JsonPreview value={event.metadata ?? {}} />
                  </article>
                ))}
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
