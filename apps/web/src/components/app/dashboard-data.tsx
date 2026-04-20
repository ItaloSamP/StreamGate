import type { ReactElement } from 'react'

import type { WorkspaceIcon } from '@/components/app/workspace-config'

type JobData = {
  id: string
  ext: string
  file: string
  progress: string
  duration: string
  status: string
  tone: string
  animated?: boolean
}

type UploadData = {
  name: string
  pct: string
  width: string
  animated?: boolean
}

type WorkerData = {
  name: string
  badge: string
  tone: string
  job: string
  width?: string
  active: boolean
  delay?: string
}

export const kpis = [
  { label: 'Jobs hoje', value: '148', sub: 'total do dia', tag: '+23', className: 'k1', tagTone: 'up' },
  { label: 'Concluidos', value: '131', sub: 'taxa de sucesso', tag: '88.5%', className: 'k2', tagTone: 'up' },
  { label: 'Em processo', value: '9', sub: 'ao vivo', tag: 'live', className: 'k3', tagTone: 'info' },
  { label: 'Falhos', value: '8', sub: 'requer atencao', tag: '+2', className: 'k4', tagTone: 'down' },
  { label: 'Quarentena', value: '7', sub: '43 registros', tag: 'revisar', className: 'k5', tagTone: 'warn' },
] as const

export const jobs: JobData[] = [
  { id: '#0441', ext: 'csv', file: 'vendas_q4.csv', progress: '67%', duration: '2m 14s', status: 'processing', tone: 'processing', animated: true },
  { id: '#0440', ext: 'json', file: 'logs_app.json', progress: '42%', duration: '1m 03s', status: 'processing', tone: 'processing', animated: true },
  { id: '#0439', ext: 'csv', file: 'catalog_sku.csv', progress: '100%', duration: '4m 22s', status: 'completed', tone: 'completed' },
  { id: '#0438', ext: 'csv', file: 'financeiro_q3.csv', progress: '100%', duration: '6m 11s', status: 'completed', tone: 'completed' },
  { id: '#0437', ext: 'json', file: 'users_export.json', progress: '100%', duration: '3m 44s', status: 'quarantined', tone: 'quarantined' },
  { id: '#0436', ext: 'csv', file: 'pedidos_batch.csv', progress: '34%', duration: '1m 58s', status: 'failed', tone: 'failed' },
  { id: '#0435', ext: 'parq', file: 'dados_raw.parquet', progress: '81%', duration: '5m 32s', status: 'processing', tone: 'processing', animated: true },
]

export const formatRows = [
  { label: 'CSV', jobs: '84', width: '72%', tone: 'var(--signal-blue)', pct: '56.8%' },
  { label: 'JSON', jobs: '38', width: '40%', tone: 'var(--signal-teal)', pct: '25.7%' },
  { label: 'Parquet', jobs: '18', width: '20%', tone: 'var(--signal-purple)', pct: '12.2%' },
  { label: 'NDJSON', jobs: '5', width: '7%', tone: 'var(--signal-yellow)', pct: '3.4%' },
  { label: 'XLSX', jobs: '3', width: '4%', tone: 'var(--signal-red)', pct: '2.0%' },
] as const

export const uploads: UploadData[] = [
  { name: 'vendas_q4_2024_full.csv', pct: '67%', width: '67%', animated: true },
  { name: 'clientes_export_marco.json', pct: '100%', width: '100%' },
]

export const queue = [
  { pos: '1', name: 'transacoes_raw.parquet', size: '812 MB', eta: '~4m' },
  { pos: '2', name: 'relatorio_anual.csv', size: '234 MB', eta: '~2m' },
  { pos: '3', name: 'estoque_atual.json', size: '56 MB', eta: '~30s' },
] as const

export const eventRows = [
  { time: '14:32:07', tone: 'up', tag: 'upload.received', msg: 'JB-0441 - vendas_q4_2024_full.csv - 234 MB - MinIO OK' },
  { time: '14:31:52', tone: 'ok', tag: 'etl.batch.loaded', msg: 'JB-0438 - 18,432 records to ClickHouse - batch 4/4' },
  { time: '14:31:40', tone: 'ok', tag: 'etl.job.completed', msg: 'JB-0438 - financeiro_q3.xlsx - 0 erros - 6m 11s' },
  { time: '14:30:11', tone: 'warn', tag: 'etl.validation.failed', msg: 'JB-0437 - 7 records to quarentena - schema col[3]' },
  { time: '14:29:55', tone: 'up', tag: 'upload.received', msg: 'JB-0440 - logs_app_mar.json - 88 MB - MinIO OK' },
  { time: '14:28:03', tone: 'error', tag: 'etl.job.failed', msg: 'JB-0436 - network timeout - retry 3/3 exhausted' },
  { time: '14:26:44', tone: 'teal', tag: 'etl.batch.loaded', msg: 'JB-0435 - 44,100 records to ClickHouse - batch 2/3' },
  { time: '14:25:30', tone: 'ok', tag: 'etl.job.completed', msg: 'JB-0434 - catalog_sku_v2.csv - 3m 12s - idempotente' },
] as const

export const workers: WorkerData[] = [
  { name: 'worker-01', badge: 'ativo', tone: 'processing', job: 'JB-0441 - vendas_q4.csv - batch 3/7', width: '43%', active: true, delay: '.0s' },
  { name: 'worker-02', badge: 'ativo', tone: 'processing', job: 'JB-0440 - logs_app.json - batch 1/3', width: '28%', active: true, delay: '.4s' },
  { name: 'worker-03', badge: 'ativo', tone: 'processing', job: 'JB-0435 - dados_raw.parquet - batch 2/3', width: '67%', active: true, delay: '.8s' },
  { name: 'worker-04', badge: 'idle', tone: 'idle', job: 'Aguardando proximo job da fila', active: false },
]

export const heatmapRows = [
  ['rgba(77,157,224,.07)', 'rgba(77,157,224,.10)', 'rgba(77,157,224,.06)', 'rgba(77,157,224,.13)', 'rgba(77,157,224,.08)', 'rgba(77,157,224,.03)', 'rgba(77,157,224,.02)'],
  ['rgba(77,157,224,.05)', 'rgba(77,157,224,.08)', 'rgba(77,157,224,.04)', 'rgba(77,157,224,.06)', 'rgba(77,157,224,.09)', 'rgba(77,157,224,.02)', 'rgba(77,157,224,.01)'],
  ['rgba(77,157,224,.22)', 'rgba(77,157,224,.28)', 'rgba(77,157,224,.19)', 'rgba(77,157,224,.26)', 'rgba(77,157,224,.32)', 'rgba(77,157,224,.09)', 'rgba(77,157,224,.04)'],
  ['rgba(77,157,224,.52)', 'rgba(77,157,224,.58)', 'rgba(77,157,224,.47)', 'rgba(60,207,207,.50)', 'rgba(60,207,207,.65)', 'rgba(77,157,224,.18)', 'rgba(77,157,224,.06)'],
  ['rgba(77,157,224,.42)', 'rgba(77,157,224,.47)', 'rgba(77,157,224,.38)', 'rgba(60,207,207,.44)', 'rgba(60,207,207,.78)', 'rgba(77,157,224,.14)', 'rgba(77,157,224,.05)'],
  ['rgba(77,157,224,.32)', 'rgba(77,157,224,.36)', 'rgba(77,157,224,.28)', 'rgba(77,157,224,.40)', 'rgba(60,207,207,.48)', 'rgba(77,157,224,.11)', 'rgba(77,157,224,.03)'],
  ['rgba(77,157,224,.18)', 'rgba(77,157,224,.20)', 'rgba(77,157,224,.15)', 'rgba(77,157,224,.22)', 'rgba(77,157,224,.25)', 'rgba(77,157,224,.08)', 'rgba(77,157,224,.03)'],
  ['rgba(77,157,224,.09)', 'rgba(77,157,224,.12)', 'rgba(77,157,224,.07)', 'rgba(77,157,224,.10)', 'rgba(77,157,224,.09)', 'rgba(77,157,224,.03)', 'rgba(77,157,224,.01)'],
] as const

export const heatmapLabels = ['00-03', '03-06', '06-09', '09-12', '12-15', '15-18', '18-21', '21-24'] as const

export function dashboardNavIcon(icon: WorkspaceIcon): ReactElement {
  switch (icon) {
    case 'dashboard':
      return (
        <svg viewBox="0 0 15 15" fill="none">
          <rect x="1" y="1" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
          <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
          <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
          <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      )
    case 'upload':
      return <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 12V3M7.5 3L3.5 7M7.5 3l4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'jobs':
      return <svg viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.2" /><path d="M7.5 4.5v3.5l1.8 1.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
    case 'analytics':
      return <svg viewBox="0 0 15 15" fill="none"><path d="M1.5 11l3.5-4 3 2 3-5.5 3.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'clickhouse':
      return <svg viewBox="0 0 15 15" fill="none"><rect x="1.5" y="4" width="12" height="8.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" /><path d="M5 4V2.5M7.5 4V2M10 4V2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
    case 'quarantine':
      return <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 2v5M7.5 9.5v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.2" /></svg>
    case 'etl':
      return <svg viewBox="0 0 15 15" fill="none"><path d="M1.5 7.5h3l1.5-3.5 2 7 1.5-3.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    case 'events':
      return <svg viewBox="0 0 15 15" fill="none"><path d="M2 4h11M2 7.5h11M2 11h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
    case 'audit':
      return <svg viewBox="0 0 15 15" fill="none"><path d="M5.5 2h4v2.5l2.5 3-2.5 3V13h-4v-2.5L3 7.5 5.5 5V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /></svg>
    case 'operations':
      return <svg viewBox="0 0 15 15" fill="none"><path d="M2 4.5h7M11 4.5h2M2 10.5h2M6 10.5h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><circle cx="10" cy="4.5" r="1.4" stroke="currentColor" strokeWidth="1.1" /><circle cx="5" cy="10.5" r="1.4" stroke="currentColor" strokeWidth="1.1" /></svg>
    case 'notifications':
      return <svg viewBox="0 0 15 15" fill="none"><path d="M3.5 11h8l-.9-1.2V6.8c0-2-1.2-3.5-3.1-3.5S4.4 4.8 4.4 6.8v3L3.5 11z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><path d="M6.2 12.2c.3.5.7.8 1.3.8s1-.3 1.3-.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
    case 'settings':
      return <svg viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2.2" stroke="currentColor" strokeWidth="1.2" /><path d="M7.5 1.5v1.8M7.5 11.7v1.8M1.5 7.5h1.8M11.7 7.5h1.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
  }
}
