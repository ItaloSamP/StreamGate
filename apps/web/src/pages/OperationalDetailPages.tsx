import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'

import { IdCopy, JsonPreview, OperationalStateBlock, statusPillClass } from '@/components/app/operational-readout'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'
import { formatDateTime, humanizeOperationalError } from '@/lib/operational-utils'
import {
  streamgateApi,
  type AuditEvent,
  type DlqMessage,
  type JobSummary,
  type QuarantineRecord,
} from '@/lib/streamgate-api'

type DetailState<T> = {
  status: 'loading' | 'success' | 'empty' | 'error' | 'denied'
  item: T | null
  errorMessage: string | null
}

function initialDetailState<T>(): DetailState<T> {
  return {
    status: 'loading',
    item: null,
    errorMessage: null,
  }
}

export function JobDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState<DetailState<JobSummary>>(initialDetailState)

  useEffect(() => {
    let active = true

    async function loadJob() {
      try {
        const response = await streamgateApi.listJobs({ search: id, page: 1, per_page: 20 })
        if (!active) return

        const item = response.data.find((job) => job.id === id) ?? response.data[0] ?? null
        setState({ status: item ? 'success' : 'empty', item, errorMessage: null })
      } catch (error) {
        if (!active) return
        setState({ status: 'error', item: null, errorMessage: humanizeOperationalError(error, 'Nao foi possivel carregar o job.') })
      }
    }

    loadJob()

    return () => {
      active = false
    }
  }, [id])

  return (
    <WorkspacePageFrame pathname="/jobs" eyebrow="Detalhe operacional" title="Jobs Operacionais">
      <DetailShell title="Detalhe do job" status={state.status} errorMessage={state.errorMessage} emptyMessage="Job nao encontrado.">
        {state.item ? (
          <DetailPanel
            rows={[
              ['job_id', state.item.id],
              ['upload_id', state.item.upload_id],
              ['status', state.item.status],
              ['source_type', state.item.source_type],
              ['trace_id', state.item.trace_id],
              ['updated_at', formatDateTime(state.item.updated_at)],
            ]}
          >
            <span className={statusPillClass(state.item.status)}>{state.item.status}</span>
            <Link className="dash-panel-tag" to={`/quarantine?job_id=${state.item.id}`}>ver quarentena relacionada</Link>
          </DetailPanel>
        ) : null}
      </DetailShell>
    </WorkspacePageFrame>
  )
}

export function QuarantineDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState<DetailState<QuarantineRecord>>(initialDetailState)

  useEffect(() => {
    let active = true

    async function loadQuarantineRecord() {
      try {
        const response = await streamgateApi.listQuarantine({ search: id, page: 1, per_page: 20 })
        if (!active) return

        const item = response.data.find((record) => record.id === id) ?? response.data[0] ?? null
        setState({ status: item ? 'success' : 'empty', item, errorMessage: null })
      } catch (error) {
        if (!active) return
        setState({ status: 'error', item: null, errorMessage: humanizeOperationalError(error, 'Nao foi possivel carregar quarentena.') })
      }
    }

    loadQuarantineRecord()

    return () => {
      active = false
    }
  }, [id])

  return (
    <WorkspacePageFrame pathname="/quarantine" eyebrow="Detalhe operacional" title="Quarentena">
      <DetailShell title="Detalhe da quarentena" status={state.status} errorMessage={state.errorMessage} emptyMessage="Registro nao encontrado.">
        {state.item ? (
          <DetailPanel
            rows={[
              ['quarantine_id', state.item.id],
              ['job_id', state.item.job_id],
              ['severity', state.item.severity],
              ['code', state.item.code],
              ['trace_id', state.item.trace_id],
              ['created_at', formatDateTime(state.item.created_at)],
            ]}
          >
            <div className="dash-module-copy">{state.item.message}</div>
            <JsonPreview value={state.item.payload ?? {}} />
          </DetailPanel>
        ) : null}
      </DetailShell>
    </WorkspacePageFrame>
  )
}

export function AuditDetailPage() {
  const { id } = useParams()
  const [state, setState] = useState<DetailState<AuditEvent>>(initialDetailState)

  useEffect(() => {
    let active = true

    async function loadAuditEvent() {
      try {
        const response = await streamgateApi.listAuditEvents({ search: id, page: 1, per_page: 20 })
        if (!active) return

        const item = response.data.find((event) => event.id === id) ?? response.data[0] ?? null
        setState({ status: item ? 'success' : 'empty', item, errorMessage: null })
      } catch (error) {
        if (!active) return
        setState({ status: 'error', item: null, errorMessage: humanizeOperationalError(error, 'Nao foi possivel carregar auditoria.') })
      }
    }

    loadAuditEvent()

    return () => {
      active = false
    }
  }, [id])

  return (
    <WorkspacePageFrame pathname="/audit" eyebrow="Detalhe operacional" title="Auditoria">
      <DetailShell title="Detalhe de auditoria" status={state.status} errorMessage={state.errorMessage} emptyMessage="Evento nao encontrado.">
        {state.item ? (
          <DetailPanel
            rows={[
              ['audit_id', state.item.id],
              ['action', state.item.action],
              ['actor_id', state.item.actor_id ?? '--'],
              ['auditable', `${state.item.auditable_type}:${state.item.auditable_id}`],
              ['request_id', state.item.request_id],
              ['trace_id', state.item.trace_id],
            ]}
          >
            <JsonPreview value={state.item.metadata ?? {}} />
          </DetailPanel>
        ) : null}
      </DetailShell>
    </WorkspacePageFrame>
  )
}

export function DlqDetailPage() {
  const { messageId } = useParams()
  const [state, setState] = useState<DetailState<DlqMessage>>(initialDetailState)

  useEffect(() => {
    let active = true

    async function loadDlqMessage() {
      try {
        const response = await streamgateApi.listQuarantineDlq({ page: 1, per_page: 20, sort_by: 'retry_count', sort_order: 'desc' })
        if (!active) return

        const index = Number.parseInt(messageId ?? '', 10)
        const item = Number.isFinite(index) ? response.data[index] ?? null : null
        setState({ status: item ? 'success' : 'empty', item, errorMessage: null })
      } catch (error) {
        if (!active) return
        setState({ status: 'error', item: null, errorMessage: humanizeOperationalError(error, 'DLQ indisponivel.') })
      }
    }

    loadDlqMessage()

    return () => {
      active = false
    }
  }, [messageId])

  return (
    <WorkspacePageFrame pathname="/quarantine" eyebrow="Detalhe operacional" title="DLQ">
      <DetailShell title="Detalhe da DLQ" status={state.status} errorMessage={state.errorMessage} emptyMessage="Mensagem DLQ nao encontrada.">
        {state.item ? (
          <DetailPanel
            rows={[
              ['routing_key', state.item.routing_key],
              ['exchange', state.item.exchange ?? '--'],
              ['retry_count', String(state.item.retry_count)],
              ['dead_letter_reason', state.item.dead_letter_reason ?? '--'],
            ]}
          >
            <JsonPreview value={{ payload: state.item.payload, headers: state.item.headers }} />
          </DetailPanel>
        ) : null}
      </DetailShell>
    </WorkspacePageFrame>
  )
}

function DetailShell({
  title,
  status,
  errorMessage,
  emptyMessage,
  children,
}: {
  title: string
  status: DetailState<unknown>['status']
  errorMessage: string | null
  emptyMessage: string
  children: ReactNode
}) {
  return (
    <div className="dash-content dash-content--module">
      <div className="dash-module-shell">
        <section className="dash-panel dash-module-card">
          <div className="dash-panel-head">
            <div>
              <div className="dash-panel-title">{title}</div>
              <div className="dash-module-copy">Rota compartilhavel para investigacao, com IDs copiaveis e payload/metadata mascarado.</div>
            </div>
          </div>
          <OperationalStateBlock status={status} errorMessage={errorMessage} emptyMessage={emptyMessage}>
            {children}
          </OperationalStateBlock>
        </section>
      </div>
    </div>
  )
}

function DetailPanel({ rows, children }: { rows: [string, string][]; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="dash-module-grid">
        {rows.map(([label, value]) => (
          <div key={label} className="dash-module-card">
            <div className="dash-module-label">{label}</div>
            <div className="dash-module-value text-base">{value}</div>
            <div className="mt-2">
              <IdCopy label={label} value={value === '--' ? null : value} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}
