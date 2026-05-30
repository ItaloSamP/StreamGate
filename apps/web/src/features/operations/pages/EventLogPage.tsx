import { useEffect, useMemo, useState } from 'react'

import {
  IdCopy,
  JsonPreview,
  OperationalStateBlock,
  OperationalToolbar,
  PaginationSummary,
} from '@/features/operations/components/operational-readout'
import { WorkspacePageFrame } from '@/features/dashboard/components/workspace-page-frame'
import { ApiClientError } from '@/lib/api-client'
import { buildCsv, downloadCsv, formatDateTime, humanizeOperationalError } from '@/lib/operational-utils'
import { streamgateApi, type RealtimeEvent } from '@/lib/streamgate-api'

type EventLogViewState = {
  status: 'loading' | 'success' | 'empty' | 'error' | 'denied'
  events: RealtimeEvent[]
  lastUpdatedAt: Date | null
  errorMessage: string | null
}

export function EventLogPage() {
  const [reloadToken, setReloadToken] = useState(0)
  const [viewState, setViewState] = useState<EventLogViewState>({
    status: 'loading',
    events: [],
    lastUpdatedAt: null,
    errorMessage: null,
  })

  useEffect(() => {
    let active = true

    async function loadEvents() {
      setViewState((current) => ({ ...current, status: 'loading', errorMessage: null }))

      try {
        const response = await streamgateApi.listRealtimeEvents({ limit: 100 })
        if (!active) return

        setViewState({
          status: response.data.length > 0 ? 'success' : 'empty',
          events: response.data,
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
            ? 'Sem permissao para consultar o event log desta superficie.'
            : humanizeOperationalError(error, 'Nao foi possivel carregar event log.'),
          lastUpdatedAt: new Date(),
        }))
      }
    }

    loadEvents()

    return () => {
      active = false
    }
  }, [reloadToken])

  const csvRows = useMemo(
    () => viewState.events.map((event) => ({
      id: event.id,
      event_type: event.event_type,
      resource_type: event.resource_type ?? '',
      resource_id: event.resource_id ?? '',
      request_id: event.request_id,
      trace_id: event.trace_id,
      occurred_at: event.occurred_at,
    })),
    [viewState.events],
  )

  function exportCsv() {
    downloadCsv('streamgate-event-log.csv', buildCsv(csvRows, ['id', 'event_type', 'resource_type', 'resource_id', 'request_id', 'trace_id', 'occurred_at']))
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
                  Timeline read-only alimentada por eventos realtime sanitizados, com request_id, trace_id e payload seguro.
                </div>
              </div>
              <div className="dash-panel-right"><span className="dash-panel-tag">realtime-backed</span></div>
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
                    <span className="dash-event-tag blue">{event.event_type}</span>
                    <span className="dash-event-msg">
                      {eventResourceLabel(event)}
                      <span className="ml-2 text-[var(--text-faint)]">{event.request_id}</span>
                    </span>
                    <span className="flex flex-wrap gap-2">
                      <IdCopy label="request_id" value={event.request_id} />
                      <IdCopy label="trace_id" value={event.trace_id} />
                    </span>
                    <JsonPreview value={event.payload ?? {}} />
                  </article>
                ))}
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] px-4 py-3">
                <PaginationSummary
                  page={1}
                  totalPages={1}
                  totalCount={viewState.events.length}
                />
              </div>
            </OperationalStateBlock>
          </section>
        </div>
      </div>
    </WorkspacePageFrame>
  )
}

function eventResourceLabel(event: RealtimeEvent) {
  if (event.resource_type && event.resource_id) {
    return `${event.resource_type}:${event.resource_id}`
  }

  return event.resource_id ?? event.resource_type ?? event.id
}
