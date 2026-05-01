import { useEffect, useMemo, useState } from 'react'

import { DashboardAlertStrip, WorkspaceOverview } from '@/components/app/workspace-overview'
import { WorkspacePageFrame } from '@/components/app/workspace-page-frame'
import { useAuth } from '@/features/auth/auth-context'
import {
  buildDashboardCommandCenterModel,
  buildDashboardExportContent,
  type DashboardExportKind,
} from '@/lib/dashboard-command-center'
import { downloadTextFile, humanizeOperationalError } from '@/lib/operational-utils'
import {
  streamgateApi,
  type AnalyticsDashboardSnapshot,
  type JobSummary,
  type PublicLinkUploadResponse,
  type UploadSummary,
} from '@/lib/streamgate-api'
import { showSingletonToast } from '@/lib/toast'
import {
  computeChecksumSha256,
  createPublicLinkIdempotencyKey,
  inferUploadContentType,
  sendFileToSignedUrl,
} from '@/lib/upload-flow'

type DashboardViewState = {
  status: 'loading' | 'success' | 'empty' | 'error'
  dashboard: AnalyticsDashboardSnapshot | null
  jobs: JobSummary[]
  uploads: UploadSummary[]
  errorMessage: string | null
}

type QuickUploadState = {
  state: 'idle' | 'signing' | 'uploading' | 'confirming' | 'requesting_link' | 'success' | 'error'
  message: string
}

const INITIAL_STATE: DashboardViewState = {
  status: 'loading',
  dashboard: null,
  jobs: [],
  uploads: [],
  errorMessage: null,
}

const INITIAL_QUICK_UPLOAD: QuickUploadState = {
  state: 'idle',
  message: 'Aguardando arquivo ou link publico.',
}

const DISMISSED_ALERTS_STORAGE_KEY = 'streamgate.dashboard.dismissed-alerts'

export function DashboardPage() {
  const { session } = useAuth()
  const role = session?.user.role ?? 'operator'
  const [viewState, setViewState] = useState<DashboardViewState>(INITIAL_STATE)
  const [reloadToken, setReloadToken] = useState(0)
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>(() => readDismissedAlertIds())
  const [quickUploadState, setQuickUploadState] = useState<QuickUploadState>(INITIAL_QUICK_UPLOAD)
  const [publicLinkUrl, setPublicLinkUrl] = useState('')
  const publicLinkBusy = quickUploadState.state === 'requesting_link'

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      setViewState((current) => ({ ...current, status: 'loading', errorMessage: null }))

      try {
        const [dashboardResponse, jobsResponse, uploadsResponse] = await Promise.all([
          streamgateApi.getAnalyticsDashboard({ preset: 'last_24h', timezone: 'UTC' }),
          streamgateApi.listJobs({ page: 1, per_page: 12 }),
          streamgateApi.listUploads({ page: 1, per_page: 8 }),
        ])

        if (!active) return

        const jobs = Array.isArray(jobsResponse.data) ? jobsResponse.data : []
        const uploads = Array.isArray(uploadsResponse.data) ? uploadsResponse.data : []

        setViewState({
          status: dashboardResponse.data ? 'success' : 'empty',
          dashboard: dashboardResponse.data,
          jobs,
          uploads,
          errorMessage: null,
        })
      } catch (error) {
        if (!active) return

        setViewState((current) => ({
          ...current,
          status: 'error',
          errorMessage: humanizeOperationalError(error, 'Nao foi possivel carregar a dashboard operacional.'),
        }))
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [reloadToken])

  const model = useMemo(() => buildDashboardCommandCenterModel({
    dashboard: viewState.dashboard,
    jobs: viewState.jobs,
    uploads: viewState.uploads,
    role,
    dismissedAlertIds,
  }), [dismissedAlertIds, role, viewState.dashboard, viewState.jobs, viewState.uploads])

  function dismissAlert(alertId: string) {
    setDismissedAlertIds((current) => {
      const next = Array.from(new Set([...current, alertId]))
      writeDismissedAlertIds(next)
      return next
    })
    showSingletonToast('info', 'Alerta fechado localmente ate a API de review/dismiss da Sprint 7.')
  }

  function handleExport(kind: DashboardExportKind, format: 'csv' | 'json') {
    const content = buildDashboardExportContent(model, kind, format)
    const suffix = format === 'json' ? 'json' : 'csv'
    const filename = `streamgate-dashboard-${kind}.${suffix}`
    const type = format === 'json' ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8'
    downloadTextFile(filename, content, type)
    showSingletonToast('success', `Export ${format.toUpperCase()} gerado do snapshot filtrado.`)
  }

  async function handleQuickUploadFile(file: File) {
    const contentType = inferUploadContentType(file)

    if (!contentType) {
      const message = 'Formato nao suportado no quick upload. Use CSV ou ZIP e abra Upload Center para outros formatos.'
      setQuickUploadState({ state: 'error', message })
      showSingletonToast('error', message)
      return
    }

    try {
      setQuickUploadState({ state: 'signing', message: 'Assinando URL de upload.' })
      const checksumSha256 = await computeChecksumSha256(file)
      const signed = await streamgateApi.requestUploadSignedUrl({
        filename: file.name,
        contentType,
        byteSize: file.size,
        checksumSha256,
      })

      setQuickUploadState({ state: 'uploading', message: 'Enviando arquivo ao storage.' })
      await sendFileToSignedUrl({
        uploadUrl: signed.data.upload_url,
        headers: signed.data.required_headers,
        file,
        contentType,
      })

      setQuickUploadState({ state: 'confirming', message: 'Confirmando upload e criando job.' })
      const registered = await streamgateApi.registerUpload({
        filename: file.name,
        contentType,
        byteSize: file.size,
        checksumSha256,
        storageKey: signed.data.storage_key,
        metadata: { ui_mode: 'dashboard_quick_upload' },
      })

      setQuickUploadState({ state: 'success', message: `Job ${registered.data.job.id} criado pelo quick upload.` })
      showSingletonToast('success', 'Quick upload confirmado e job criado.')
      setReloadToken((current) => current + 1)
    } catch (error) {
      const message = humanizeOperationalError(error, 'Falha no quick upload da dashboard.')
      setQuickUploadState({ state: 'error', message })
      showSingletonToast('error', message)
    }
  }

  async function handlePublicLinkSubmit() {
    const url = publicLinkUrl.trim()

    if (!url || publicLinkBusy) return

    try {
      setQuickUploadState({ state: 'requesting_link', message: 'Criando upload por link publico.' })
      const filename = filenameFromUrl(url)
      const response = await streamgateApi.createPublicLinkUpload({
        url,
        filename,
        contentType: 'text/csv',
        byteSize: 1,
        idempotencyKey: createPublicLinkIdempotencyKey(),
      })

      setPublicLinkUrl('')
      setQuickUploadState({ state: 'success', message: quickLinkSuccess(response.data) })
      showSingletonToast('success', 'Link publico aceito e job criado.')
      setReloadToken((current) => current + 1)
    } catch (error) {
      const message = humanizeOperationalError(error, 'Falha ao criar upload por link publico.')
      setQuickUploadState({ state: 'error', message })
      showSingletonToast('error', message)
    }
  }

  return (
    <WorkspacePageFrame
      pathname="/dashboard"
      eyebrow="Visao geral do sistema"
      title="Dashboard"
      secondaryActionLabel={null}
      alertStrip={<DashboardAlertStrip model={model} onDismiss={dismissAlert} />}
    >
      <WorkspaceOverview
        model={model}
        onExport={handleExport}
        onQuickUploadFile={handleQuickUploadFile}
        quickUploadState={quickUploadState}
        publicLinkValue={publicLinkUrl}
        publicLinkBusy={publicLinkBusy}
        onPublicLinkChange={setPublicLinkUrl}
        onPublicLinkSubmit={handlePublicLinkSubmit}
      />

      {viewState.errorMessage ? (
        <div className="dash-content dash-content--module">
          <section className="dash-panel">
            <div className="dash-panel-head">
              <div className="dash-panel-title">Estado do runtime</div>
              <div className="dash-panel-right"><span className="dash-panel-tag">erro</span></div>
            </div>
            <div className="dash-module-note">{viewState.errorMessage}</div>
          </section>
        </div>
      ) : null}
    </WorkspacePageFrame>
  )
}

function readDismissedAlertIds() {
  try {
    const raw = window.localStorage.getItem(DISMISSED_ALERTS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : []
  } catch {
    return []
  }
}

function writeDismissedAlertIds(ids: string[]) {
  window.localStorage.setItem(DISMISSED_ALERTS_STORAGE_KEY, JSON.stringify(ids))
}

function filenameFromUrl(value: string) {
  try {
    const url = new URL(value)
    const lastSegment = url.pathname.split('/').filter(Boolean).pop()
    return lastSegment && lastSegment.includes('.') ? lastSegment : 'dashboard-public-link.csv'
  } catch {
    return 'dashboard-public-link.csv'
  }
}

function quickLinkSuccess(response: PublicLinkUploadResponse) {
  const masked = response.acquisition?.url_masked ? ` (${response.acquisition.url_masked})` : ''
  return `Job ${response.job.id} criado por link publico${masked}.`
}
