import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'

import { IdCopy, JsonPreview, OperationalStateBlock, statusPillClass } from '@/components/app/operational-readout'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'
import { Button } from '@/components/ui/button'
import { formatDateTime, humanizeOperationalError } from '@/lib/operational-utils'
import {
  streamgateApi,
  type AuditEvent,
  type DlqMessage,
  type JobArtifact,
  type JobSummary,
  type QuarantineRecord,
} from '@/lib/streamgate-api'
import { showSingletonToast } from '@/lib/toast'

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
  const [artifactState, setArtifactState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; artifacts: JobArtifact[]; errorMessage: string | null }>({
    status: 'idle',
    artifacts: [],
    errorMessage: null,
  })

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

  useEffect(() => {
    if (!id) return

    let active = true
    const jobId = id

    async function loadArtifacts() {
      setArtifactState((current) => ({ ...current, status: 'loading', errorMessage: null }))

      try {
        const response = await streamgateApi.listJobArtifacts(jobId)
        if (!active) return
        setArtifactState({ status: 'success', artifacts: response.data, errorMessage: null })
      } catch (error) {
        if (!active) return
        setArtifactState({ status: 'error', artifacts: [], errorMessage: humanizeOperationalError(error, 'Nao foi possivel carregar artefatos.') })
      }
    }

    loadArtifacts()

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
            <ArtifactsHistory jobId={state.item.id} state={artifactState} />
          </DetailPanel>
        ) : null}
      </DetailShell>
    </WorkspacePageFrame>
  )
}

function ArtifactsHistory({
  jobId,
  state,
}: {
  jobId: string
  state: { status: 'idle' | 'loading' | 'success' | 'error'; artifacts: JobArtifact[]; errorMessage: string | null }
}) {
  const grouped = state.artifacts.reduce<Record<string, JobArtifact[]>>((acc, artifact) => {
    acc[artifact.artifact_type] = [...(acc[artifact.artifact_type] ?? []), artifact]
    return acc
  }, {})

  async function downloadArtifact(artifact: JobArtifact) {
    try {
      const response = await streamgateApi.createArtifactDownloadUrl(jobId, artifact.id)
      window.open(response.data.download_url, '_blank', 'noopener,noreferrer')
      showSingletonToast('success', `URL de download gerada ate ${formatDateTime(response.data.expires_at)}.`)
    } catch (error) {
      showSingletonToast('error', humanizeOperationalError(error, 'URL expirada ou artefato indisponivel. Tente novamente.'))
    }
  }

  return (
    <section className="dash-panel dash-module-card">
      <div className="dash-panel-head">
        <div>
          <div className="dash-panel-title">Artefatos finais</div>
          <div className="dash-module-copy">Historico por tipo com latest destacado, checksum, expiracao e download por URL assinada curta.</div>
        </div>
      </div>

      {state.status === 'loading' ? <div className="p-4 text-mono text-[11px] text-[var(--text-dim)]">Carregando artefatos...</div> : null}
      {state.status === 'error' ? <div className="p-4 text-mono text-[11px] text-[var(--signal-red)]">{state.errorMessage}</div> : null}
      {state.status === 'success' && state.artifacts.length === 0 ? <div className="p-4 text-mono text-[11px] text-[var(--text-dim)]">Worker ainda nao gerou artefatos para este job.</div> : null}
      {state.status === 'success' && state.artifacts.length > 0 ? (
        <div className="flex flex-col gap-4 p-4">
          {Object.entries(grouped).map(([type, artifacts]) => (
            <div key={type} className="rounded-lg border border-[var(--border)] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="dash-panel-title">{humanizeArtifactType(type)}</span>
                <span className="dash-panel-tag">latest {artifacts[0]?.status ?? '--'}</span>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {artifacts.map((artifact, index) => (
                  <div key={artifact.id} className="flex flex-wrap items-center gap-3 rounded-md bg-white/[0.03] p-3">
                    <span className={`dash-pill ${artifact.status === 'available' ? 'dash-pill--done' : artifact.status === 'failed' ? 'dash-pill--failed' : 'dash-pill--neutral'}`}>
                      {index === 0 ? 'latest' : 'historico'} | {artifact.status}
                    </span>
                    <span className="name">{artifact.filename}</span>
                    <span className="dash-panel-tag">{formatBytes(artifact.byte_size)}</span>
                    <span className="dash-panel-tag">sha {artifact.checksum_sha256?.slice(0, 10) ?? '--'}</span>
                    <span className="dash-panel-tag">gerado {formatDateTime(artifact.generated_at)}</span>
                    <span className="dash-panel-tag">expira {formatDateTime(artifact.expires_at)}</span>
                    <Button type="button" variant="panel" size="sm" disabled={artifact.status !== 'available'} onClick={() => void downloadArtifact(artifact)}>
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function humanizeArtifactType(type: string) {
  switch (type) {
    case 'processed_dataset':
      return 'Processed dataset'
    case 'quality_report':
      return 'Quality report'
    case 'audit_report':
      return 'Audit report'
    default:
      return type
  }
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
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
