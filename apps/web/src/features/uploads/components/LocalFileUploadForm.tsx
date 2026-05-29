import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type UploadContentType } from '@/lib/streamgate-api'
import { inferUploadContentType, runSignedFileUpload } from '@/lib/upload-flow'
import { showSingletonToast } from '@/lib/toast'
import { humanizeOperationalError } from '@/lib/operational-utils'

import { FlowReadout } from './FlowReadout'
import type { UploadFlowState, UploadMode } from '../types'

export function LocalFileUploadForm({ busy, onSuccess }: { busy: boolean; onSuccess: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [detectedContentType, setDetectedContentType] = useState<UploadContentType | null>(null)
  const [flowState, setFlowState] = useState<UploadFlowState>('idle')
  const [flowError, setFlowError] = useState<string | null>(null)
  const [flowSummary, setFlowSummary] = useState<{
    mode: UploadMode
    uploadId: string
    jobId: string
    idempotent: boolean
  } | null>(null)

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedFile || !detectedContentType || busy) {
      return
    }

    try {
      setFlowError(null)
      setFlowSummary(null)

      const registered = await runSignedFileUpload({
        file: selectedFile,
        metadata: {
          ui_mode: 'guided',
        },
        onStep: (step) => setFlowState(step),
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
      onSuccess()
    } catch (error) {
      const message = humanizeOperationalError(error, 'Falha ao concluir o fluxo de upload.')
      setFlowState('error')
      setFlowError(message)
      showSingletonToast('error', message)
    }
  }

  const isFormBusy = busy || flowState === 'signing' || flowState === 'uploading' || flowState === 'confirming'

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="upload-file">Arquivo (ZIP ou CSV)</Label>
        <Input
          id="upload-file"
          type="file"
          accept=".zip,.csv,.json,.ndjson,.jsonl,.xlsx,.parquet,text/csv,application/json,application/zip,application/x-ndjson,application/ndjson,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.apache.parquet"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            handleFileSelection(file)
          }}
          disabled={isFormBusy}
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
        <Button type="submit" variant="panel" size="xl" disabled={!selectedFile || !detectedContentType || isFormBusy}>
          {isFormBusy ? 'Processando upload...' : 'Enviar arquivo'}
        </Button>
        <Button type="button" variant="outline" size="xl" onClick={onSuccess}>
          Atualizar listas
        </Button>
      </div>
    </form>
  )
}
