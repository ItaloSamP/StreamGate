/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  copyText,
  formatDateTime,
  maskOperationalPayload,
  shouldMarkStale,
} from '@/lib/operational-utils'

export type OperationalStatus = 'loading' | 'success' | 'empty' | 'error' | 'denied'

export function OperationalStateBlock({
  status,
  errorMessage,
  emptyMessage,
  children,
}: {
  status: OperationalStatus
  errorMessage?: string | null
  emptyMessage: string
  children: ReactNode
}) {
  if (status === 'loading') {
    return <div className="p-5 text-mono text-[11px] text-[var(--text-dim)]">Carregando leitura operacional...</div>
  }

  if (status === 'denied') {
    return (
      <div className="p-5 text-mono text-[11px] text-[var(--signal-yellow)]">
        Permissao negada para esta superficie. Entre com um usuario admin ou ajuste o escopo da consulta.
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="p-5 text-mono text-[11px] text-[var(--signal-red)]">
        {errorMessage ?? 'Nao foi possivel carregar esta leitura operacional.'}
      </div>
    )
  }

  if (status === 'empty') {
    return <div className="p-5 text-mono text-[11px] text-[var(--text-dim)]">{emptyMessage}</div>
  }

  return <>{children}</>
}

export function OperationalToolbar({
  lastUpdatedAt,
  onRefresh,
  onExport,
  exportDisabled = false,
}: {
  lastUpdatedAt: Date | null
  onRefresh: () => void
  onExport?: () => void
  exportDisabled?: boolean
}) {
  const stale = shouldMarkStale(lastUpdatedAt)

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--border)] p-4 md:flex-row md:items-center md:justify-between">
      <div className="text-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
        Atualizado: {lastUpdatedAt ? formatDateTime(lastUpdatedAt.toISOString()) : '--'}
        {stale ? <span className="ml-2 text-[var(--signal-yellow)]">stale</span> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {onExport ? (
          <Button type="button" variant="panel" size="sm" onClick={onExport} disabled={exportDisabled}>
            Exportar CSV
          </Button>
        ) : null}
        <Button type="button" variant="panel" size="sm" onClick={onRefresh}>
          Recarregar
        </Button>
      </div>
    </div>
  )
}

export function IdCopy({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null

  return (
    <button
      type="button"
      className="dash-panel-tag"
      title={`Copiar ${label}`}
      onClick={() => {
        void copyText(value)
      }}
    >
      {label}: {value}
    </button>
  )
}

export function JsonPreview({ value }: { value: unknown }) {
  return (
    <details className="text-mono text-[10px] text-[var(--text-dim)]">
      <summary className="cursor-pointer text-[var(--text-faint)]">JSON mascarado</summary>
      <pre className="mt-3 max-h-56 overflow-auto rounded-xl border border-[var(--border)] bg-black/30 p-3">
        {JSON.stringify(maskOperationalPayload(value), null, 2)}
      </pre>
    </details>
  )
}

export function PaginationSummary({
  page,
  totalPages,
  totalCount,
}: {
  page: number
  totalPages: number
  totalCount: number
}) {
  return (
    <div className="text-mono text-[10px] text-[var(--text-faint)]">
      Pagina {page} de {Math.max(1, totalPages)} | Total {totalCount}
    </div>
  )
}

export function statusPillClass(status: string) {
  if (status === 'completed') return 'dash-pill dash-pill--done'
  if (status === 'failed') return 'dash-pill dash-pill--failed'
  if (status.includes('quarantine')) return 'dash-pill dash-pill--quarantine'
  if (status === 'processing') return 'dash-pill dash-pill--processing'
  return 'dash-pill dash-pill--neutral'
}
