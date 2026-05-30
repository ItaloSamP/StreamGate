import { formatDateTime } from '@/lib/operational-utils'
import type { JobSummary } from '@/lib/streamgate-api'
import type { ListState } from '../types'

export function JobTable({ state }: { state: ListState<JobSummary> }) {
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
              <td className="p-4 text-xs tabular-nums text-slate-400">{formatDateTime(job.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
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
