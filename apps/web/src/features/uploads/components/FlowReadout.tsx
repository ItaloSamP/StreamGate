import type { UploadMode, UploadFlowState } from '../types'

export function FlowReadout({
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
            : flowSummary.mode === 'connector'
              ? `Conector aceito: upload ${flowSummary.uploadId} e job ${flowSummary.jobId} criados${flowSummary.idempotent ? ' (idempotente).' : '.'}`
              : `Upload ${flowSummary.uploadId} confirmado e job ${flowSummary.jobId} criado${flowSummary.idempotent ? ' (idempotente).' : '.'}`}
          {flowSummary.acquisitionUrl ? <div className="mt-1 text-[var(--text-soft)]">{flowSummary.acquisitionUrl}</div> : null}
        </div>
      ) : null}
    </>
  )
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
    case 'requesting_connector':
      return 'Solicitando ingestao por conector'
    case 'success':
      return 'Fluxo concluido com sucesso'
    case 'error':
      return 'Erro no fluxo de upload'
    default:
      return 'Aguardando envio'
  }
}
