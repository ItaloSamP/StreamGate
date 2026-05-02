import { useEffect, useState } from 'react'

import { resolveApiBaseUrl } from '@/lib/api-client'
import { streamgateApi, type RealtimeEvent } from '@/lib/streamgate-api'

export type DashboardRealtimeState = {
  status: 'connecting' | 'live' | 'polling' | 'stale' | 'degraded'
  detail: string
  lastEventAt: string | null
}

const POLL_INTERVAL_MS = 15_000

export function dashboardCableUrl(baseUrl = resolveApiBaseUrl()) {
  const url = new URL(baseUrl)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/cable'
  url.search = ''
  return url.toString()
}

export function useDashboardRealtime({
  enabled,
  onEvents,
}: {
  enabled: boolean
  onEvents: (events: RealtimeEvent[]) => void
}) {
  const [state, setState] = useState<DashboardRealtimeState>({
    status: 'connecting',
    detail: 'Preparando canal realtime.',
    lastEventAt: null,
  })

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    let socket: WebSocket | null = null
    let pollTimer: number | null = null
    let lastSeen: string | null = null

    async function poll(reason: string) {
      if (cancelled) return

      setState((current) => ({
        status: current.status === 'stale' ? 'stale' : 'polling',
        detail: reason,
        lastEventAt: current.lastEventAt,
      }))

      try {
        const response = await streamgateApi.listRealtimeEvents({ since: lastSeen ?? undefined, limit: 50 })
        if (cancelled) return

        const events = response.data ?? []
        const newest = events[0]?.occurred_at ?? lastSeen
        if (newest) lastSeen = newest
        if (events.length > 0) onEvents(events)
        setState({
          status: events.length > 0 ? 'polling' : 'stale',
          detail: events.length > 0 ? 'Fallback polling ativo.' : 'Sem evento novo no fallback polling.',
          lastEventAt: newest ?? null,
        })
      } catch {
        if (!cancelled) {
          setState((current) => ({
            status: 'degraded',
            detail: 'Realtime e polling indisponiveis.',
            lastEventAt: current.lastEventAt,
          }))
        }
      }
    }

    function startPolling(reason: string) {
      if (cancelled || pollTimer !== null) return
      void poll(reason)
      pollTimer = window.setInterval(() => {
        void poll('Fallback polling ativo.')
      }, POLL_INTERVAL_MS)
    }

    async function connect() {
      try {
        const response = await streamgateApi.createRealtimeTicket()
        if (cancelled) return

        const ticket = response.data.ticket
        if (typeof window.WebSocket !== 'function') {
          startPolling('WebSocket indisponivel no navegador; usando polling.')
          return
        }

        const identifier = JSON.stringify({ channel: 'RealtimeChannel' })
        socket = new window.WebSocket(`${dashboardCableUrl()}?ticket=${encodeURIComponent(ticket)}`)

        socket.addEventListener('open', () => {
          socket?.send(JSON.stringify({ command: 'subscribe', identifier }))
        })

        socket.addEventListener('message', (event) => {
          try {
            const payload = JSON.parse(String(event.data)) as { type?: string; message?: RealtimeEvent }
            if (payload.type === 'confirm_subscription') {
              setState((current) => ({ ...current, status: 'live', detail: 'WebSocket ativo.' }))
              return
            }

            if (payload.message) {
              lastSeen = payload.message.occurred_at ?? lastSeen
              onEvents([payload.message])
              setState({ status: 'live', detail: 'WebSocket ativo.', lastEventAt: lastSeen })
            }
          } catch {
            setState((current) => ({ ...current, status: 'degraded', detail: 'Evento realtime invalido.' }))
          }
        })

        socket.addEventListener('error', () => startPolling('WebSocket indisponivel; usando polling.'))
        socket.addEventListener('close', () => startPolling('WebSocket fechado; usando polling.'))
      } catch {
        startPolling('Ticket realtime indisponivel; usando polling.')
      }
    }

    void connect()

    return () => {
      cancelled = true
      if (pollTimer !== null) window.clearInterval(pollTimer)
      socket?.close()
    }
  }, [enabled, onEvents])

  return state
}
