import { formatDateTime } from '@/lib/operational-utils'
import type { UploadSummary } from '@/lib/streamgate-api'
import type { ListState } from '../types'

export function UploadTable({ state }: { state: ListState<UploadSummary> }) {
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
              <td className="p-4 text-xs tabular-nums text-slate-400">{formatDateTime(upload.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
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
