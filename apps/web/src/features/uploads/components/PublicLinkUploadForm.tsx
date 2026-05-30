import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { streamgateApi, type UploadContentType } from '@/lib/streamgate-api'
import { createPublicLinkIdempotencyKey } from '@/lib/upload-flow'
import { humanizeOperationalError } from '@/lib/operational-utils'
import { showSingletonToast } from '@/lib/toast'

import { FlowReadout } from './FlowReadout'
import type { UploadFlowState, UploadMode } from '../types'

export function PublicLinkUploadForm({ busy, onSuccess }: { busy: boolean; onSuccess: () => void }) {
  const [form, setForm] = useState({
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (busy) return

    const url = form.url.trim()
    const filename = form.filename.trim()
    const byteSize = Number.parseInt(form.byteSize, 10)

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
        contentType: form.contentType,
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
      onSuccess()
    } catch (error) {
      const message = humanizeOperationalError(error, 'Falha ao criar upload por link publico.')
      setFlowState('error')
      setFlowError(message)
      showSingletonToast('error', message)
    }
  }

  const isFormBusy = busy || flowState === 'requesting_link'

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="public-link-url">URL publica</Label>
        <Input
          id="public-link-url"
          type="url"
          value={form.url}
          onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
          placeholder="https://example.com/dataset.csv"
          disabled={isFormBusy}
        />
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="public-link-filename">Nome do arquivo</Label>
          <Input
            id="public-link-filename"
            value={form.filename}
            onChange={(event) => setForm((current) => ({ ...current, filename: event.target.value }))}
            placeholder="dataset.csv"
            disabled={isFormBusy}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="public-link-content-type">Content type</Label>
          <select
            id="public-link-content-type"
            className="input-shell"
            value={form.contentType}
            onChange={(event) => setForm((current) => ({ ...current, contentType: event.target.value as UploadContentType }))}
            disabled={isFormBusy}
          >
            <option value="text/csv">text/csv</option>
            <option value="application/json">application/json</option>
            <option value="application/x-ndjson">application/x-ndjson</option>
            <option value="application/zip">application/zip</option>
            <option value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">application/vnd.openxmlformats-officedocument.spreadsheetml.sheet</option>
            <option value="application/vnd.apache.parquet">application/vnd.apache.parquet</option>
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="public-link-byte-size">Tamanho estimado (bytes)</Label>
          <Input
            id="public-link-byte-size"
            type="number"
            min="1"
            value={form.byteSize}
            onChange={(event) => setForm((current) => ({ ...current, byteSize: event.target.value }))}
            disabled={isFormBusy}
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
          disabled={!form.url.trim() || !form.filename.trim() || !form.byteSize.trim() || isFormBusy}
        >
          {isFormBusy ? 'Criando upload por link...' : 'Criar upload por link'}
        </Button>
        <Button type="button" variant="outline" size="xl" onClick={onSuccess}>
          Atualizar listas
        </Button>
      </div>
    </form>
  )
}
