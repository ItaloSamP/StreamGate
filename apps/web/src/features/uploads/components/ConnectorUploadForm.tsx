import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { streamgateApi, type ConnectorProfile, type GoogleDriveItem, type UploadContentType } from '@/lib/streamgate-api'
import { createConnectorIngestionIdempotencyKey } from '@/lib/upload-flow'
import { humanizeOperationalError } from '@/lib/operational-utils'
import { showSingletonToast } from '@/lib/toast'

import { FlowReadout } from './FlowReadout'
import type { UploadFlowState, UploadMode } from '../types'

export function ConnectorUploadForm({
  connectorProfiles,
  busy,
  connectorProfileState,
  onSuccess,
  onReloadProfiles,
}: {
  connectorProfiles: ConnectorProfile[]
  busy: boolean
  connectorProfileState: 'idle' | 'loading' | 'success' | 'error' | 'denied'
  onSuccess: () => void
  onReloadProfiles: () => void
}) {
  const [form, setForm] = useState({
    profileId: connectorProfiles[0]?.id || '',
    filename: '',
    contentType: 'text/csv' as UploadContentType,
    source: '',
    driveItemId: '',
  })
  const [driveItems, setDriveItems] = useState<GoogleDriveItem[]>([])
  const [driveItemsState, setDriveItemsState] = useState<'idle' | 'loading' | 'success' | 'empty' | 'error'>('idle')
  const [flowState, setFlowState] = useState<UploadFlowState>('idle')
  const [flowError, setFlowError] = useState<string | null>(null)
  const [flowSummary, setFlowSummary] = useState<{
    mode: UploadMode
    uploadId: string
    jobId: string
    idempotent: boolean
  } | null>(null)

  const selectedProfile = connectorProfiles.find((entry) => entry.id === form.profileId) ?? null
  const selectedDriveItem = driveItems.find((entry) => entry.id === form.driveItemId) ?? null

  async function handleLoadGoogleDriveItems() {
    if (busy || selectedProfile?.kind !== 'google_drive') return

    try {
      setDriveItemsState('loading')
      const response = await streamgateApi.listGoogleDriveItems()
      const rows = Array.isArray(response.data) ? response.data : []
      setDriveItems(rows)
      setDriveItemsState(rows.length > 0 ? 'success' : 'empty')
      setForm((current) => ({
        ...current,
        driveItemId: current.driveItemId || rows[0]?.id || '',
      }))
    } catch {
      setDriveItems([])
      setDriveItemsState('error')
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (busy) return

    const filename = form.filename.trim()
    const source = form.source.trim()

    if (!selectedProfile || !filename || (selectedProfile.kind === 'google_drive' ? !selectedDriveItem : !source)) {
      setFlowState('error')
      setFlowError(selectedProfile?.kind === 'google_drive'
        ? 'Selecione perfil, arquivo de destino e item do Google Drive.'
        : 'Selecione perfil, arquivo de destino e object key/caminho HTTP.')
      return
    }

    try {
      setFlowError(null)
      setFlowSummary(null)
      setFlowState('requesting_connector')

      const response = await streamgateApi.createConnectorIngestion(selectedProfile.id, {
        filename,
        contentType: form.contentType,
        objectKey: selectedProfile.kind === 's3' ? source : undefined,
        sourcePath: selectedProfile.kind === 'http' || selectedProfile.kind === 'oauth_delegated' ? source : undefined,
        driveFileId: selectedProfile.kind === 'google_drive' && selectedDriveItem && selectedDriveItem.kind !== 'folder' ? selectedDriveItem.id : undefined,
        driveFolderId: selectedProfile.kind === 'google_drive' && selectedDriveItem && selectedDriveItem.kind === 'folder' ? selectedDriveItem.id : undefined,
        idempotencyKey: createConnectorIngestionIdempotencyKey(),
      })

      setFlowSummary({
        mode: 'connector',
        uploadId: response.data.upload.id,
        jobId: response.data.job.id,
        idempotent: response.meta?.idempotent === true,
      })
      setFlowState('success')
      showSingletonToast('success', 'Ingestao por conector solicitada.')
      onSuccess()
    } catch (error) {
      const message = humanizeOperationalError(error, 'Falha ao solicitar ingestao por conector.')
      setFlowState('error')
      setFlowError(message)
      showSingletonToast('error', message)
    }
  }

  const isGoogleDrive = selectedProfile?.kind === 'google_drive'

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="connector-profile">Perfil de conector</Label>
          <select
            id="connector-profile"
            className="input-shell"
            value={form.profileId}
            onChange={(event) => setForm((current) => ({ ...current, profileId: event.target.value, source: '', driveItemId: '' }))}
            disabled={busy || connectorProfileState === 'loading'}
          >
            {connectorProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>{profile.name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="connector-filename">Arquivo de destino</Label>
          <Input
            id="connector-filename"
            value={form.filename}
            onChange={(event) => setForm((current) => ({ ...current, filename: event.target.value }))}
            placeholder="orders.ndjson"
            disabled={busy}
          />
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {isGoogleDrive ? (
          <div className="grid gap-3 rounded-lg border border-[var(--border)] bg-[color:rgb(255_255_255_/_0.02)] p-4">
            <div>
              <div className="dash-panel-title">Google Drive delegated</div>
              <div className="dash-module-copy">
                Arquivos e pastas usam OAuth delegado; refresh token e client secret ficam criptografados apenas no backend.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="dash-pill dash-pill--neutral">Drive restricted scope</span>
              <span className="dash-pill dash-pill--neutral">scan-first</span>
              <span className="dash-pill dash-pill--neutral">file/folder ingestion</span>
            </div>
            <Button type="button" variant="outline" size="xl" onClick={handleLoadGoogleDriveItems} disabled={busy || driveItemsState === 'loading'}>
              {driveItemsState === 'loading' ? 'Listando Drive...' : 'Listar Google Drive'}
            </Button>
            <div className="grid gap-2">
              <Label htmlFor="connector-drive-item">Item do Google Drive</Label>
              <select
                id="connector-drive-item"
                className="input-shell"
                value={form.driveItemId}
                onChange={(event) => setForm((current) => ({ ...current, driveItemId: event.target.value }))}
                disabled={busy || driveItems.length === 0}
              >
                {driveItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.kind === 'folder' ? 'pasta' : 'arquivo'})
                  </option>
                ))}
              </select>
            </div>
            {driveItemsState === 'idle' ? (
              <div className="text-mono text-[11px] text-[var(--text-dim)]">Liste os itens do Drive para escolher arquivo ou pasta.</div>
            ) : null}
            {driveItemsState === 'empty' ? (
              <div className="text-mono text-[11px] text-[var(--text-dim)]">Nenhum item do Google Drive disponivel.</div>
            ) : null}
            {driveItemsState === 'error' ? (
              <div className="text-mono text-[11px] text-[var(--signal-red)]">Nao foi possivel listar itens do Google Drive.</div>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="connector-source">Origem remota (S3 Object Key, HTTP URL)</Label>
            <Input
              id="connector-source"
              value={form.source}
              onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}
              placeholder={selectedProfile?.kind === 'oauth_delegated' || selectedProfile?.kind === 'http' ? '/orders.ndjson' : 'incoming/orders.ndjson'}
              disabled={busy}
            />
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="connector-content-type">Content type do conector</Label>
          <select
            id="connector-content-type"
            className="input-shell"
            value={form.contentType}
            onChange={(event) => setForm((current) => ({ ...current, contentType: event.target.value as UploadContentType }))}
            disabled={busy}
          >
            <option value="text/csv">text/csv</option>
            <option value="application/json">application/json</option>
            <option value="application/x-ndjson">application/x-ndjson</option>
            <option value="application/ndjson">application/ndjson</option>
            <option value="application/zip">application/zip</option>
            <option value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">application/vnd.openxmlformats-officedocument.spreadsheetml.sheet</option>
            <option value="application/vnd.apache.parquet">application/vnd.apache.parquet</option>
          </select>
        </div>
      </div>

      <div className="text-mono text-[11px] text-[var(--text-dim)]">
        Perfis e segredos ficam no backend; a UI nunca exibe tokens internos, bucket/key completo ou headers sensiveis retornados.
      </div>

      {connectorProfileState === 'error' ? (
        <div className="text-mono text-[11px] text-[var(--signal-red)]">Nao foi possivel carregar perfis de conectores.</div>
      ) : null}

      <FlowReadout flowState={flowState} flowError={flowError} flowSummary={flowSummary} />

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          variant="panel"
          size="xl"
          disabled={!form.profileId || !form.filename.trim() || (isGoogleDrive ? !form.driveItemId : !form.source.trim()) || busy || flowState === 'requesting_connector'}
        >
          {flowState === 'requesting_connector' ? 'Solicitando ingestao...' : 'Solicitar ingestao por conector'}
        </Button>
        <Button type="button" variant="outline" size="xl" onClick={onReloadProfiles}>
          Atualizar perfis
        </Button>
      </div>
    </form>
  )
}
