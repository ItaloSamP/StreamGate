import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'
import { useAuth } from '@/features/auth/auth-context'
import { streamgateApi, type ConnectorProfile, type JobSummary, type UploadSummary } from '@/lib/streamgate-api'
import { humanizeOperationalError } from '@/lib/operational-utils'

import type { ListState, UploadMode } from '@/features/uploads/types'
import { UploadTable } from '@/features/uploads/components/UploadTable'
import { JobTable } from '@/features/uploads/components/JobTable'
import { LocalFileUploadForm } from '@/features/uploads/components/LocalFileUploadForm'
import { PublicLinkUploadForm } from '@/features/uploads/components/PublicLinkUploadForm'
import { ConnectorUploadForm } from '@/features/uploads/components/ConnectorUploadForm'

const DEFAULT_PER_PAGE = 20

const UPLOAD_STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'registered', label: 'Registrado' },
  { value: 'stored', label: 'Armazenado' },
  { value: 'processing', label: 'Processando' },
  { value: 'completed', label: 'Concluido' },
  { value: 'failed', label: 'Falhou' },
  { value: 'quarantined', label: 'Quarentena' },
] as const

const JOB_STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'processing', label: 'Processando' },
  { value: 'completed', label: 'Concluido' },
  { value: 'failed', label: 'Falhou' },
  { value: 'quarantined_with_warnings', label: 'Quarentena com alertas' },
] as const

const INITIAL_UPLOADS_STATE: ListState<UploadSummary> = {
  status: 'loading',
  rows: [],
  pagination: { page: 1, per_page: DEFAULT_PER_PAGE, total_count: 0, total_pages: 0 },
  errorMessage: null,
}

const INITIAL_JOBS_STATE: ListState<JobSummary> = {
  status: 'loading',
  rows: [],
  pagination: { page: 1, per_page: DEFAULT_PER_PAGE, total_count: 0, total_pages: 0 },
  errorMessage: null,
}

export function UploadPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { session } = useAuth()
  const isAdmin = session?.user.role === 'admin'

  const [uploadMode, setUploadMode] = useState<UploadMode>('file')
  const [connectorProfiles, setConnectorProfiles] = useState<ConnectorProfile[]>([])
  const [connectorProfileState, setConnectorProfileState] = useState<'idle' | 'loading' | 'success' | 'error' | 'denied'>('idle')
  
  const [uploadsState, setUploadsState] = useState<ListState<UploadSummary>>(INITIAL_UPLOADS_STATE)
  const [jobsState, setJobsState] = useState<ListState<JobSummary>>(INITIAL_JOBS_STATE)
  const [reloadToken, setReloadToken] = useState(0)

  const uploadStatusFilter = (searchParams.get('upload_status') ?? '').trim()
  const uploadPage = useMemo(() => parsePage(searchParams.get('upload_page')), [searchParams])

  const jobStatusFilter = (searchParams.get('job_status') ?? '').trim()
  const jobPage = useMemo(() => parsePage(searchParams.get('job_page')), [searchParams])

  useEffect(() => {
    let active = true

    async function loadUploads() {
      setUploadsState((current) => ({ ...current, status: 'loading', errorMessage: null }))
      try {
        const response = await streamgateApi.listUploads({ status: uploadStatusFilter || undefined, page: uploadPage, per_page: DEFAULT_PER_PAGE })
        if (!active) return
        const rows = Array.isArray(response.data) ? response.data : []
        const pagination = response.meta?.pagination ?? { page: uploadPage, per_page: DEFAULT_PER_PAGE, total_count: rows.length, total_pages: rows.length > 0 ? 1 : 0 }
        setUploadsState({ status: rows.length > 0 ? 'success' : 'empty', rows, pagination, errorMessage: null })
      } catch (error) {
        if (active) setUploadsState((current) => ({ ...current, status: 'error', errorMessage: humanizeOperationalError(error, 'Nao foi possivel carregar uploads.') }))
      }
    }

    loadUploads()
    return () => { active = false }
  }, [reloadToken, uploadPage, uploadStatusFilter])

  useEffect(() => {
    let active = true

    async function loadJobs() {
      setJobsState((current) => ({ ...current, status: 'loading', errorMessage: null }))
      try {
        const response = await streamgateApi.listJobs({ status: jobStatusFilter || undefined, page: jobPage, per_page: DEFAULT_PER_PAGE })
        if (!active) return
        const rows = Array.isArray(response.data) ? response.data : []
        const pagination = response.meta?.pagination ?? { page: jobPage, per_page: DEFAULT_PER_PAGE, total_count: rows.length, total_pages: rows.length > 0 ? 1 : 0 }
        setJobsState({ status: rows.length > 0 ? 'success' : 'empty', rows, pagination, errorMessage: null })
      } catch (error) {
        if (active) setJobsState((current) => ({ ...current, status: 'error', errorMessage: humanizeOperationalError(error, 'Nao foi possivel carregar jobs.') }))
      }
    }

    loadJobs()
    return () => { active = false }
  }, [jobPage, jobStatusFilter, reloadToken])

  useEffect(() => {
    if (!isAdmin) {
      setConnectorProfiles([])
      setConnectorProfileState('denied')
      if (uploadMode === 'connector') setUploadMode('file')
      return
    }

    let active = true

    async function loadConnectorProfiles() {
      setConnectorProfileState('loading')
      try {
        const response = await streamgateApi.listConnectorProfiles()
        if (!active) return
        const rows = Array.isArray(response.data) ? response.data : []
        setConnectorProfiles(rows)
        setConnectorProfileState(rows.length > 0 ? 'success' : 'idle')
      } catch {
        if (active) setConnectorProfileState('error')
      }
    }

    loadConnectorProfiles()
    return () => { active = false }
  }, [isAdmin, reloadToken, uploadMode])

  function updateUrlState(next: { upload_status?: string; upload_page?: number; job_status?: string; job_page?: number }) {
    const params = new URLSearchParams(searchParams)
    setOptionalStringParam(params, 'upload_status', next.upload_status ?? uploadStatusFilter)
    setOptionalPageParam(params, 'upload_page', next.upload_page ?? uploadPage)
    setOptionalStringParam(params, 'job_status', next.job_status ?? jobStatusFilter)
    setOptionalPageParam(params, 'job_page', next.job_page ?? jobPage)
    setSearchParams(params)
  }

  function reloadData() {
    setReloadToken((current) => current + 1)
  }

  return (
    <WorkspacePageFrame
      pathname="/upload"
      eyebrow="Ingestao e entrada"
      title="Upload Center"
      primaryActionLabel="Novo upload"
      secondaryActionLabel="Atualizar"
    >
      <div className="dash-content dash-content--module">
        <div className="dash-module-shell">
          <section className="dash-panel dash-module-card">
            <div className="dash-panel-head">
              <div>
                <div className="dash-panel-title">Entrada de dados</div>
                <div className="dash-module-copy">
                  Escolha entre arquivo local via URL assinada ou link publico validado pelo worker dedicado.
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-4">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant={uploadMode === 'file' ? 'panel' : 'outline'} size="xl" onClick={() => setUploadMode('file')}>
                  Arquivo local
                </Button>
                <Button type="button" variant={uploadMode === 'public_link' ? 'panel' : 'outline'} size="xl" onClick={() => setUploadMode('public_link')}>
                  Link publico
                </Button>
                {isAdmin ? (
                  <Button type="button" variant={uploadMode === 'connector' ? 'panel' : 'outline'} size="xl" onClick={() => setUploadMode('connector')}>
                    Conector
                  </Button>
                ) : null}
              </div>

              {uploadMode === 'file' ? (
                <LocalFileUploadForm busy={false} onSuccess={reloadData} />
              ) : uploadMode === 'public_link' ? (
                <PublicLinkUploadForm busy={false} onSuccess={reloadData} />
              ) : (
                <ConnectorUploadForm 
                  connectorProfiles={connectorProfiles} 
                  connectorProfileState={connectorProfileState} 
                  busy={false} 
                  onSuccess={reloadData} 
                  onReloadProfiles={reloadData}
                />
              )}
            </div>
          </section>

          <section className="dash-panel dash-module-card">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Uploads reais</div>
            </div>

            <div className="flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between">
              <div className="flex min-w-[240px] flex-1 flex-col gap-2">
                <label htmlFor="upload-status-filter" className="text-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
                  Status de upload
                </label>
                <select
                  id="upload-status-filter"
                  className="input-shell"
                  value={uploadStatusFilter}
                  onChange={(event) => updateUrlState({ upload_status: event.target.value, upload_page: 1 })}
                >
                  {UPLOAD_STATUS_OPTIONS.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <UploadTable state={uploadsState} />

            {uploadsState.status === 'success' ? (
              <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] px-4 py-3">
                <div className="text-mono text-[10px] text-[var(--text-faint)]">
                  Pagina {uploadsState.pagination.page} de {Math.max(1, uploadsState.pagination.total_pages)} | Total {uploadsState.pagination.total_count}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="panel"
                    size="sm"
                    onClick={() => updateUrlState({ upload_page: uploadPage - 1 })}
                    disabled={uploadPage <= 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="panel"
                    size="sm"
                    onClick={() => updateUrlState({ upload_page: uploadPage + 1 })}
                    disabled={uploadPage >= uploadsState.pagination.total_pages}
                  >
                    Proxima
                  </Button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="dash-panel dash-module-card">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Jobs gerados</div>
            </div>

            <div className="flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between">
              <div className="flex min-w-[240px] flex-1 flex-col gap-2">
                <label htmlFor="job-status-filter" className="text-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
                  Status do job
                </label>
                <select
                  id="job-status-filter"
                  className="input-shell"
                  value={jobStatusFilter}
                  onChange={(event) => updateUrlState({ job_status: event.target.value, job_page: 1 })}
                >
                  {JOB_STATUS_OPTIONS.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <JobTable state={jobsState} />

            {jobsState.status === 'success' ? (
              <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] px-4 py-3">
                <div className="text-mono text-[10px] text-[var(--text-faint)]">
                  Pagina {jobsState.pagination.page} de {Math.max(1, jobsState.pagination.total_pages)} | Total {jobsState.pagination.total_count}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="panel"
                    size="sm"
                    onClick={() => updateUrlState({ job_page: jobPage - 1 })}
                    disabled={jobPage <= 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    variant="panel"
                    size="sm"
                    onClick={() => updateUrlState({ job_page: jobPage + 1 })}
                    disabled={jobPage >= jobsState.pagination.total_pages}
                  >
                    Proxima
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </WorkspacePageFrame>
  )
}

function parsePage(raw: string | null) {
  const parsed = Number.parseInt(raw ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

function setOptionalStringParam(params: URLSearchParams, key: string, value: string) {
  if (value.trim().length > 0) {
    params.set(key, value)
  } else {
    params.delete(key)
  }
}

function setOptionalPageParam(params: URLSearchParams, key: string, value: number) {
  if (value > 1) {
    params.set(key, String(value))
  } else {
    params.delete(key)
  }
}
