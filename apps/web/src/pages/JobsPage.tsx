import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { OperationalToolbar } from '@/components/app/operational-readout'
import { Button } from '@/components/ui/button'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'
import { ApiClientError } from '@/lib/api-client'
import { buildCsv, downloadCsv } from '@/lib/operational-utils'
import { streamgateApi, type JobSummary } from '@/lib/streamgate-api'

const DEFAULT_PER_PAGE = 20

const JOB_STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'processing', label: 'Processando' },
  { value: 'completed', label: 'Concluido' },
  { value: 'failed', label: 'Falhou' },
  { value: 'quarantined_with_warnings', label: 'Quarentena com alertas' },
] as const

type JobsViewState = {
  status: 'loading' | 'success' | 'empty' | 'error'
  jobs: JobSummary[]
  pagination: {
    page: number
    per_page: number
    total_count: number
    total_pages: number
  }
  lastUpdatedAt: Date | null
  errorMessage: string | null
}

const INITIAL_STATE: JobsViewState = {
  status: 'loading',
  jobs: [],
  pagination: {
    page: 1,
    per_page: DEFAULT_PER_PAGE,
    total_count: 0,
    total_pages: 0,
  },
  lastUpdatedAt: null,
  errorMessage: null,
}

export function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [reloadToken, setReloadToken] = useState(0)
  const [viewState, setViewState] = useState<JobsViewState>(INITIAL_STATE)

  const statusFilter = (searchParams.get('status') ?? '').trim()
  const page = useMemo(() => {
    const parsed = Number.parseInt(searchParams.get('page') ?? '', 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
  }, [searchParams])

  useEffect(() => {
    let active = true

    async function loadJobs() {
      setViewState((current) => ({ ...current, status: 'loading', errorMessage: null }))

      try {
        const response = await streamgateApi.listJobs({
          status: statusFilter || undefined,
          page,
          per_page: DEFAULT_PER_PAGE,
        })

        if (!active) return

        const jobs = Array.isArray(response.data) ? response.data : []
        const pagination = response.meta?.pagination ?? {
          page,
          per_page: DEFAULT_PER_PAGE,
          total_count: jobs.length,
          total_pages: jobs.length > 0 ? 1 : 0,
        }

        setViewState({
          status: jobs.length > 0 ? 'success' : 'empty',
          jobs,
          pagination,
          lastUpdatedAt: new Date(),
          errorMessage: null,
        })
      } catch (error) {
        if (!active) return

        setViewState((current) => ({
          ...current,
          status: 'error',
          lastUpdatedAt: new Date(),
          errorMessage: humanizeError(error, 'Nao foi possivel carregar jobs operacionais.'),
        }))
      }
    }

    loadJobs()

    return () => {
      active = false
    }
  }, [page, reloadToken, statusFilter])

  function updateUrlState(next: { status?: string; page?: number }) {
    const params = new URLSearchParams(searchParams)
    const nextStatus = next.status ?? statusFilter
    const nextPage = next.page ?? page

    if (nextStatus) {
      params.set('status', nextStatus)
    } else {
      params.delete('status')
    }

    if (nextPage > 1) {
      params.set('page', String(nextPage))
    } else {
      params.delete('page')
    }

    setSearchParams(params)
  }

  function handleStatusChange(nextStatus: string) {
    updateUrlState({ status: nextStatus, page: 1 })
  }

  function goToPreviousPage() {
    if (page <= 1) return
    updateUrlState({ page: page - 1 })
  }

  function goToNextPage() {
    const totalPages = Math.max(1, viewState.pagination.total_pages)
    if (page >= totalPages) return
    updateUrlState({ page: page + 1 })
  }

  function exportCsv() {
    const rows = viewState.jobs.map((job) => ({
      id: job.id,
      upload_id: job.upload_id,
      status: job.status,
      source_type: job.source_type,
      trace_id: job.trace_id,
      created_at: job.created_at,
      updated_at: job.updated_at,
    }))

    downloadCsv('streamgate-jobs.csv', buildCsv(rows, ['id', 'upload_id', 'status', 'source_type', 'trace_id', 'created_at', 'updated_at']))
  }

  return (
    <WorkspacePageFrame
      pathname="/jobs"
      eyebrow="Execucao e throughput"
      title="Jobs Operacionais"
      primaryActionLabel="Atualizar jobs"
      secondaryActionLabel="Exportar"
    >
      <div className="dash-content dash-content--module">
        <div className="dash-module-shell">
          <section className="dash-panel dash-module-card">
            <div className="dash-panel-head">
              <div>
                <div className="dash-panel-title">Leitura real de jobs</div>
                <div className="dash-module-copy">
                  Listagem conectada ao backend com filtros por status, paginacao por URL e resposta operacional com envelope.
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between">
              <div className="flex min-w-[240px] flex-1 flex-col gap-2">
                <label htmlFor="jobs-status-filter" className="text-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
                  Status
                </label>
                <select
                  id="jobs-status-filter"
                  className="input-shell"
                  value={statusFilter}
                onChange={(event) => handleStatusChange(event.target.value)}
                >
                  {JOB_STATUS_OPTIONS.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <OperationalToolbar
                lastUpdatedAt={viewState.lastUpdatedAt}
                onRefresh={() => setReloadToken((current) => current + 1)}
                onExport={exportCsv}
                exportDisabled={viewState.jobs.length === 0}
              />
            </div>
          </section>

          <section className="dash-panel dash-module-card">
            {viewState.status === 'loading' ? (
              <div className="p-5 text-mono text-[11px] text-[var(--text-dim)]">Carregando jobs operacionais...</div>
            ) : null}

            {viewState.status === 'error' ? (
              <div className="flex flex-col gap-3 p-5">
                <div className="text-mono text-[11px] text-[var(--signal-red)]">{viewState.errorMessage ?? 'Falha ao carregar jobs.'}</div>
                <div>
                  <Button type="button" variant="panel" size="sm" onClick={() => setReloadToken((current) => current + 1)}>
                    Tentar novamente
                  </Button>
                </div>
              </div>
            ) : null}

            {viewState.status === 'empty' ? (
              <div className="p-5 text-mono text-[11px] text-[var(--text-dim)]">
                Nenhum job encontrado para este filtro. Ajuste o status ou aguarde novos uploads.
              </div>
            ) : null}

            {viewState.status === 'success' ? (
              <>
                <div className="dash-table-scroll">
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Job</th>
                        <th>Upload</th>
                        <th>Status</th>
                        <th>Origem</th>
                        <th>Criado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewState.jobs.map((job) => (
                        <tr key={job.id}>
                          <td className="name">{job.id}</td>
                          <td className="dim">{job.upload_id}</td>
                          <td>
                            <span className={`dash-pill ${statusTone(job.status)}`}>{humanizeJobStatus(job.status)}</span>
                          </td>
                          <td className="dim">{job.source_type}</td>
                          <td className="dim">{formatTimestamp(job.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] px-4 py-3">
                  <div className="text-mono text-[10px] text-[var(--text-faint)]">
                    Pagina {viewState.pagination.page} de {Math.max(1, viewState.pagination.total_pages)} | Total {viewState.pagination.total_count}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="panel" size="sm" onClick={goToPreviousPage} disabled={page <= 1}>
                      Anterior
                    </Button>
                    <Button
                      type="button"
                      variant="panel"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={page >= Math.max(1, viewState.pagination.total_pages)}
                    >
                      Proxima
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </section>
        </div>
      </div>
    </WorkspacePageFrame>
  )
}

function statusTone(status: string) {
  switch (status) {
    case 'completed':
      return 'dash-pill--done'
    case 'failed':
      return 'dash-pill--failed'
    case 'processing':
      return 'dash-pill--processing'
    case 'quarantined_with_warnings':
      return 'dash-pill--quarantine'
    default:
      return 'dash-pill--neutral'
  }
}

function humanizeJobStatus(status: string) {
  switch (status) {
    case 'pending':
      return 'Pendente'
    case 'processing':
      return 'Processando'
    case 'completed':
      return 'Concluido'
    case 'failed':
      return 'Falhou'
    case 'quarantined_with_warnings':
      return 'Quarentena'
    default:
      return status
  }
}

function formatTimestamp(value: string | null) {
  if (!value) return '--'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '--'

  return parsed.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function humanizeError(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    return `${error.message} (${error.code})`
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}
