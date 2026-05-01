import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'
import { ApiClientError } from '@/lib/api-client'
import { streamgateApi, type JobSummary, type UploadContentType, type UploadSummary } from '@/lib/streamgate-api'
import { showSingletonToast } from '@/lib/toast'
import {
  computeChecksumSha256,
  createPublicLinkIdempotencyKey,
  inferUploadContentType,
  sendFileToSignedUrl,
} from '@/lib/upload-flow'

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

type UploadMode = 'file' | 'public_link'
type UploadFlowState = 'idle' | 'signing' | 'uploading' | 'confirming' | 'requesting_link' | 'success' | 'error'

type ListState<T> = {
  status: 'loading' | 'success' | 'empty' | 'error'
  rows: T[]
  pagination: {
    page: number
    per_page: number
    total_count: number
    total_pages: number
  }
  errorMessage: string | null
}

const INITIAL_UPLOADS_STATE: ListState<UploadSummary> = {
  status: 'loading',
  rows: [],
  pagination: {
    page: 1,
    per_page: DEFAULT_PER_PAGE,
    total_count: 0,
    total_pages: 0,
  },
  errorMessage: null,
}

const INITIAL_JOBS_STATE: ListState<JobSummary> = {
  status: 'loading',
  rows: [],
  pagination: {
    page: 1,
    per_page: DEFAULT_PER_PAGE,
    total_count: 0,
    total_pages: 0,
  },
  errorMessage: null,
}

export function UploadPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [detectedContentType, setDetectedContentType] = useState<UploadContentType | null>(null)
  const [uploadMode, setUploadMode] = useState<UploadMode>('file')
  const [publicLinkForm, setPublicLinkForm] = useState({
    url: '',
    filename: '',
    contentType: 'text/csv' as UploadContentType,
    byteSize: '',
  })
  const [flowState, setFlowState] = useState<UploadFlowState>('idle')
  const [flowError, setFlowError] = useState<string | null>(null)
  const [flowSummary, setFlowSummary] = useState<{
    mode: UploadMode
    uploadId: string
    jobId: string
    idempotent: boolean
    acquisitionUrl?: string | null
  } | null>(null)

  const [uploadsState, setUploadsState] = useState<ListState<UploadSummary>>(INITIAL_UPLOADS_STATE)
  const [jobsState, setJobsState] = useState<ListState<JobSummary>>(INITIAL_JOBS_STATE)
  const [reloadToken, setReloadToken] = useState(0)

  const uploadStatusFilter = (searchParams.get('upload_status') ?? '').trim()
  const uploadPage = useMemo(() => parsePage(searchParams.get('upload_page')), [searchParams])

  const jobStatusFilter = (searchParams.get('job_status') ?? '').trim()
  const jobPage = useMemo(() => parsePage(searchParams.get('job_page')), [searchParams])

  const busy = flowState === 'signing' || flowState === 'uploading' || flowState === 'confirming' || flowState === 'requesting_link'

  useEffect(() => {
    let active = true

    async function loadUploads() {
      setUploadsState((current) => ({ ...current, status: 'loading', errorMessage: null }))

      try {
        const response = await streamgateApi.listUploads({
          status: uploadStatusFilter || undefined,
          page: uploadPage,
          per_page: DEFAULT_PER_PAGE,
        })

        if (!active) return

        const rows = Array.isArray(response.data) ? response.data : []
        const pagination = response.meta?.pagination ?? {
          page: uploadPage,
          per_page: DEFAULT_PER_PAGE,
          total_count: rows.length,
          total_pages: rows.length > 0 ? 1 : 0,
        }

        setUploadsState({
          status: rows.length > 0 ? 'success' : 'empty',
          rows,
          pagination,
          errorMessage: null,
        })
      } catch (error) {
        if (!active) return

        setUploadsState((current) => ({
          ...current,
          status: 'error',
          errorMessage: humanizeError(error, 'Nao foi possivel carregar uploads.'),
        }))
      }
    }

    loadUploads()

    return () => {
      active = false
    }
  }, [reloadToken, uploadPage, uploadStatusFilter])

  useEffect(() => {
    let active = true

    async function loadJobs() {
      setJobsState((current) => ({ ...current, status: 'loading', errorMessage: null }))

      try {
        const response = await streamgateApi.listJobs({
          status: jobStatusFilter || undefined,
          page: jobPage,
          per_page: DEFAULT_PER_PAGE,
        })

        if (!active) return

        const rows = Array.isArray(response.data) ? response.data : []
        const pagination = response.meta?.pagination ?? {
          page: jobPage,
          per_page: DEFAULT_PER_PAGE,
          total_count: rows.length,
          total_pages: rows.length > 0 ? 1 : 0,
        }

        setJobsState({
          status: rows.length > 0 ? 'success' : 'empty',
          rows,
          pagination,
          errorMessage: null,
        })
      } catch (error) {
        if (!active) return

        setJobsState((current) => ({
          ...current,
          status: 'error',
          errorMessage: humanizeError(error, 'Nao foi possivel carregar jobs recentes.'),
        }))
      }
    }

    loadJobs()

    return () => {
      active = false
    }
  }, [jobPage, jobStatusFilter, reloadToken])

  function updateUrlState(next: {
    upload_status?: string
    upload_page?: number
    job_status?: string
    job_page?: number
  }) {
    const params = new URLSearchParams(searchParams)

    const nextUploadStatus = next.upload_status ?? uploadStatusFilter
    const nextUploadPage = next.upload_page ?? uploadPage
    const nextJobStatus = next.job_status ?? jobStatusFilter
    const nextJobPage = next.job_page ?? jobPage

    setOptionalStringParam(params, 'upload_status', nextUploadStatus)
    setOptionalPageParam(params, 'upload_page', nextUploadPage)
    setOptionalStringParam(params, 'job_status', nextJobStatus)
    setOptionalPageParam(params, 'job_page', nextJobPage)

    setSearchParams(params)
  }

  function switchUploadMode(nextMode: UploadMode) {
    setUploadMode(nextMode)
    setFlowState('idle')
    setFlowError(null)
    setFlowSummary(null)
  }

  function handleFileSelection(file: File | null) {
    setFlowError(null)
    setFlowSummary(null)

    if (!file) {
      setSelectedFile(null)
      setDetectedContentType(null)
      setFlowState('idle')
      return
    }

    const nextContentType = inferUploadContentType(file)
    if (!nextContentType) {
      setSelectedFile(null)
      setDetectedContentType(null)
      setFlowState('error')
      setFlowError('Formato nao suportado. Envie apenas arquivos ZIP ou CSV.')
      return
    }

    setSelectedFile(file)
    setDetectedContentType(nextContentType)
    setFlowState('idle')
  }

  async function handleUploadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedFile || !detectedContentType || busy) {
      return
    }

    try {
      setFlowError(null)
      setFlowSummary(null)

      const checksumSha256 = await computeChecksumSha256(selectedFile)

      setFlowState('signing')
      const signed = await streamgateApi.requestUploadSignedUrl({
        filename: selectedFile.name,
        contentType: detectedContentType,
        byteSize: selectedFile.size,
        checksumSha256,
      })

      setFlowState('uploading')
      await sendFileToSignedUrl({
        uploadUrl: signed.data.upload_url,
        headers: signed.data.required_headers,
        file: selectedFile,
        contentType: detectedContentType,
      })

      setFlowState('confirming')
      const registered = await streamgateApi.registerUpload({
        filename: selectedFile.name,
        contentType: detectedContentType,
        byteSize: selectedFile.size,
        checksumSha256,
        storageKey: signed.data.storage_key,
        metadata: {
          ui_mode: 'guided',
        },
      })

      setFlowSummary({
        mode: 'file',
        uploadId: registered.data.upload.id,
        jobId: registered.data.job.id,
        idempotent: registered.meta?.idempotent === true,
      })
      setFlowState('success')
      setSelectedFile(null)
      setDetectedContentType(null)

      showSingletonToast('success', 'Upload confirmado e job criado.')
      setReloadToken((current) => current + 1)
    } catch (error) {
      const message = humanizeError(error, 'Falha ao concluir o fluxo de upload.')
      setFlowState('error')
      setFlowError(message)
      showSingletonToast('error', message)
    }
  }

  async function handlePublicLinkSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (busy) return

    const url = publicLinkForm.url.trim()
    const filename = publicLinkForm.filename.trim()
    const byteSize = Number.parseInt(publicLinkForm.byteSize, 10)

    if (!url || !filename || !Number.isFinite(byteSize) || byteSize <= 0) {
      setFlowState('error')
      setFlowError('Informe URL publica, nome do arquivo e tamanho estimado validos.')
      return
    }

    try {
      setFlowError(null)
      setFlowSummary(null)
      setFlowState('requesting_link')

      const response = await streamgateApi.createPublicLinkUpload({
        url,
        filename,
        contentType: publicLinkForm.contentType,
        byteSize,
        idempotencyKey: createPublicLinkIdempotencyKey(),
      })

      setFlowSummary({
        mode: 'public_link',
        uploadId: response.data.upload.id,
        jobId: response.data.job.id,
        idempotent: response.meta?.idempotent === true,
        acquisitionUrl: response.data.acquisition?.url_masked ?? null,
      })
      setFlowState('success')
      showSingletonToast('success', 'Link publico aceito e job criado.')
      setReloadToken((current) => current + 1)
    } catch (error) {
      const message = humanizeError(error, 'Falha ao criar upload por link publico.')
      setFlowState('error')
      setFlowError(message)
      showSingletonToast('error', message)
    }
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
                <Button type="button" variant={uploadMode === 'file' ? 'panel' : 'outline'} size="xl" onClick={() => switchUploadMode('file')} disabled={busy}>
                  Arquivo local
                </Button>
                <Button type="button" variant={uploadMode === 'public_link' ? 'panel' : 'outline'} size="xl" onClick={() => switchUploadMode('public_link')} disabled={busy}>
                  Link publico
                </Button>
              </div>

              {uploadMode === 'file' ? (
                <form key="file-upload-form" className="grid gap-4" onSubmit={handleUploadSubmit}>
                  <div className="grid gap-2">
                    <Label htmlFor="upload-file">Arquivo (ZIP ou CSV)</Label>
                    <Input
                      id="upload-file"
                      type="file"
                      accept=".zip,.csv,text/csv,application/zip"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null
                        handleFileSelection(file)
                      }}
                      disabled={busy}
                    />
                  </div>

                  <div className="text-mono text-[11px] text-[var(--text-dim)]">
                    {selectedFile ? `Selecionado: ${selectedFile.name} (${selectedFile.size} bytes)` : 'Nenhum arquivo selecionado.'}
                  </div>

                  <div className="text-mono text-[11px] text-[var(--text-dim)]">
                    Tipo detectado: {detectedContentType ?? '--'}
                  </div>

                  <FlowReadout flowState={flowState} flowError={flowError} flowSummary={flowSummary} />

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" variant="panel" size="xl" disabled={!selectedFile || !detectedContentType || busy}>
                      {busy ? 'Processando upload...' : 'Enviar arquivo'}
                    </Button>
                    <Button type="button" variant="outline" size="xl" onClick={() => setReloadToken((current) => current + 1)}>
                      Atualizar listas
                    </Button>
                  </div>
                </form>
              ) : (
                <form key="public-link-upload-form" className="grid gap-4" onSubmit={handlePublicLinkSubmit}>
                  <div className="grid gap-2">
                    <Label htmlFor="public-link-url">URL publica</Label>
                    <Input
                      id="public-link-url"
                      type="url"
                      value={publicLinkForm.url}
                      onChange={(event) => setPublicLinkForm((current) => ({ ...current, url: event.target.value }))}
                      placeholder="https://example.com/dataset.csv"
                      disabled={busy}
                    />
                  </div>

                  <div className="grid gap-2 md:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="public-link-filename">Nome do arquivo</Label>
                      <Input
                        id="public-link-filename"
                        value={publicLinkForm.filename}
                        onChange={(event) => setPublicLinkForm((current) => ({ ...current, filename: event.target.value }))}
                        placeholder="dataset.csv"
                        disabled={busy}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="public-link-content-type">Content type</Label>
                      <select
                        id="public-link-content-type"
                        className="input-shell"
                        value={publicLinkForm.contentType}
                        onChange={(event) => setPublicLinkForm((current) => ({ ...current, contentType: event.target.value as UploadContentType }))}
                        disabled={busy}
                      >
                        <option value="text/csv">text/csv</option>
                        <option value="application/zip">application/zip</option>
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="public-link-byte-size">Tamanho estimado (bytes)</Label>
                      <Input
                        id="public-link-byte-size"
                        type="number"
                        min="1"
                        value={publicLinkForm.byteSize}
                        onChange={(event) => setPublicLinkForm((current) => ({ ...current, byteSize: event.target.value }))}
                        disabled={busy}
                      />
                    </div>
                  </div>

                  <div className="text-mono text-[11px] text-[var(--text-dim)]">
                    O backend mascara query string e credenciais; o worker baixa e publica o evento recebido sem expor payload bruto.
                  </div>

                  <FlowReadout flowState={flowState} flowError={flowError} flowSummary={flowSummary} />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="submit"
                      variant="panel"
                      size="xl"
                      disabled={!publicLinkForm.url.trim() || !publicLinkForm.filename.trim() || !publicLinkForm.byteSize.trim() || busy}
                    >
                      {busy ? 'Criando upload por link...' : 'Criar upload por link'}
                    </Button>
                    <Button type="button" variant="outline" size="xl" onClick={() => setReloadToken((current) => current + 1)}>
                      Atualizar listas
                    </Button>
                  </div>
                </form>
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

            {renderUploadTable(uploadsState)}

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
                    disabled={uploadPage >= Math.max(1, uploadsState.pagination.total_pages)}
                  >
                    Proxima
                  </Button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="dash-panel dash-module-card">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Jobs recentes</div>
            </div>

            <div className="flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between">
              <div className="flex min-w-[240px] flex-1 flex-col gap-2">
                <label htmlFor="job-status-filter" className="text-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
                  Status de job
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

            {renderJobTable(jobsState)}

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
                    disabled={jobPage >= Math.max(1, jobsState.pagination.total_pages)}
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

function renderUploadTable(state: ListState<UploadSummary>) {
  if (state.status === 'loading') {
    return <div className="p-5 text-mono text-[11px] text-[var(--text-dim)]">Carregando uploads...</div>
  }

  if (state.status === 'error') {
    return <div className="p-5 text-mono text-[11px] text-[var(--signal-red)]">{state.errorMessage ?? 'Erro ao carregar uploads.'}</div>
  }

  if (state.status === 'empty') {
    return (
      <div className="p-5 text-mono text-[11px] text-[var(--text-dim)]">
        Nenhum upload encontrado. Envie um arquivo ZIP ou CSV para iniciar o fluxo.
      </div>
    )
  }

  return (
    <div className="dash-table-scroll">
      <table className="dash-table">
        <thead>
          <tr>
            <th>Upload</th>
            <th>Arquivo</th>
            <th>Status</th>
            <th>Origem</th>
            <th>Content type</th>
            <th>Criado em</th>
          </tr>
        </thead>
        <tbody>
          {state.rows.map((upload) => (
            <tr key={upload.id}>
              <td className="name">{upload.id}</td>
              <td className="dim">{upload.filename}</td>
              <td>
                <span className={`dash-pill ${uploadTone(upload.status)}`}>{humanizeUploadStatus(upload.status)}</span>
              </td>
              <td className="dim">{upload.source_type ?? 'upload'}</td>
              <td className="dim">{upload.content_type}</td>
              <td className="dim">{formatTimestamp(upload.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderJobTable(state: ListState<JobSummary>) {
  if (state.status === 'loading') {
    return <div className="p-5 text-mono text-[11px] text-[var(--text-dim)]">Carregando jobs recentes...</div>
  }

  if (state.status === 'error') {
    return <div className="p-5 text-mono text-[11px] text-[var(--signal-red)]">{state.errorMessage ?? 'Erro ao carregar jobs.'}</div>
  }

  if (state.status === 'empty') {
    return <div className="p-5 text-mono text-[11px] text-[var(--text-dim)]">Nenhum job encontrado para este filtro.</div>
  }

  return (
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
          {state.rows.map((job) => (
            <tr key={job.id}>
              <td className="name">{job.id}</td>
              <td className="dim">{job.upload_id}</td>
              <td>
                <span className={`dash-pill ${jobTone(job.status)}`}>{humanizeJobStatus(job.status)}</span>
              </td>
              <td className="dim">{job.source_type}</td>
              <td className="dim">{formatTimestamp(job.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FlowReadout({
  flowState,
  flowError,
  flowSummary,
}: {
  flowState: UploadFlowState
  flowError: string | null
  flowSummary: {
    mode: UploadMode
    uploadId: string
    jobId: string
    idempotent: boolean
    acquisitionUrl?: string | null
  } | null
}) {
  return (
    <>
      <div className="rounded-lg border border-[var(--border)] bg-[color:rgb(255_255_255_/_0.02)] px-3 py-2 text-mono text-[11px] text-[var(--text-soft)]">
        Etapa atual: {flowStepLabel(flowState)}
      </div>

      {flowError ? <div className="text-mono text-[11px] text-[var(--signal-red)]">{flowError}</div> : null}

      {flowSummary ? (
        <div className="rounded-lg border border-[color:rgb(62_207_142_/_0.3)] bg-[color:rgb(62_207_142_/_0.08)] px-3 py-2 text-mono text-[11px] text-[var(--signal-green)]">
          {flowSummary.mode === 'public_link'
            ? `Link publico aceito: upload ${flowSummary.uploadId} e job ${flowSummary.jobId} criados${flowSummary.idempotent ? ' (idempotente).' : '.'}`
            : `Upload ${flowSummary.uploadId} confirmado e job ${flowSummary.jobId} criado${flowSummary.idempotent ? ' (idempotente).' : '.'}`}
          {flowSummary.acquisitionUrl ? <div className="mt-1 text-[var(--text-soft)]">{flowSummary.acquisitionUrl}</div> : null}
        </div>
      ) : null}
    </>
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

function flowStepLabel(state: UploadFlowState) {
  switch (state) {
    case 'idle':
      return 'Aguardando envio'
    case 'signing':
      return 'Assinando URL de upload'
    case 'uploading':
      return 'Enviando arquivo ao storage'
    case 'confirming':
      return 'Confirmando upload e criando job'
    case 'requesting_link':
      return 'Solicitando acquisition por link publico'
    case 'success':
      return 'Fluxo concluido com sucesso'
    case 'error':
      return 'Erro no fluxo de upload'
    default:
      return 'Aguardando envio'
  }
}

function uploadTone(status: string) {
  switch (status) {
    case 'completed':
      return 'dash-pill--done'
    case 'failed':
      return 'dash-pill--failed'
    case 'processing':
      return 'dash-pill--processing'
    case 'quarantined':
      return 'dash-pill--quarantine'
    default:
      return 'dash-pill--neutral'
  }
}

function jobTone(status: string) {
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

function humanizeUploadStatus(status: string) {
  switch (status) {
    case 'registered':
      return 'Registrado'
    case 'stored':
      return 'Armazenado'
    case 'processing':
      return 'Processando'
    case 'completed':
      return 'Concluido'
    case 'failed':
      return 'Falhou'
    case 'quarantined':
      return 'Quarentena'
    default:
      return status
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
