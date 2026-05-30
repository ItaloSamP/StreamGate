export type WorkspaceRoute =
  | '/dashboard'
  | '/upload'
  | '/jobs'
  | '/analytics'
  | '/clickhouse'
  | '/quarantine'
  | '/etl-explorer'
  | '/events'
  | '/audit'
  | '/operations'
  | '/notifications'
  | '/settings'

export type WorkspaceIcon =
  | 'dashboard'
  | 'upload'
  | 'jobs'
  | 'analytics'
  | 'clickhouse'
  | 'quarantine'
  | 'etl'
  | 'events'
  | 'audit'
  | 'operations'
  | 'notifications'
  | 'settings'

export type WorkspaceNavItem = {
  label: string
  href: WorkspaceRoute
  icon: WorkspaceIcon
  adminOnly?: boolean
  badge?: {
    tone?: 'default' | 'info' | 'alert'
    text: string
  }
  match?: 'exact' | 'prefix'
}

export type WorkspaceModuleDefinition = {
  title: string
  eyebrow: string
  description: string
  route: WorkspaceRoute
  family: 'operational' | 'analytical' | 'system'
}

export const workspaceNavGroups: { label: string; items: WorkspaceNavItem[] }[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: 'dashboard', match: 'exact' },
      { label: 'Upload', href: '/upload', icon: 'upload' },
      { label: 'Jobs', href: '/jobs', icon: 'jobs' },
    ],
  },
  {
    label: 'Analise',
    items: [
      { label: 'Analytics', href: '/analytics', icon: 'analytics' },
      { label: 'ClickHouse', href: '/clickhouse', icon: 'clickhouse' },
      { label: 'Quarentena', href: '/quarantine', icon: 'quarantine' },
      { label: 'ETL Explorer', href: '/etl-explorer', icon: 'etl' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Event Log', href: '/events', icon: 'events' },
      { label: 'Auditoria', href: '/audit', icon: 'audit', adminOnly: true },
      { label: 'Operacoes Seguras', href: '/operations', icon: 'operations', adminOnly: true },
      { label: 'Notificacoes', href: '/notifications', icon: 'notifications' },
      { label: 'Configuracoes', href: '/settings', icon: 'settings' },
    ],
  },
]

export const workspaceModules: WorkspaceModuleDefinition[] = [
  {
    title: 'Dashboard Operacional',
    eyebrow: 'Visao geral do sistema',
    description: 'Leitura consolidada do pipeline com KPIs, jobs ativos, fila, workers e eventos recentes.',
    route: '/dashboard',
    family: 'operational',
  },
  {
    title: 'Upload Center',
    eyebrow: 'Ingestao e entrada',
    description: 'Superficie reservada para upload assinado, politicas de arquivo, progresso de envio e validacao inicial.',
    route: '/upload',
    family: 'operational',
  },
  {
    title: 'Jobs Operacionais',
    eyebrow: 'Execucao e throughput',
    description: 'Lista operacional de jobs, filtros, estados reais do pipeline e trilha de progresso por execucao.',
    route: '/jobs',
    family: 'operational',
  },
  {
    title: 'Analytics Workspace',
    eyebrow: 'Leitura analitica',
    description: 'Area reservada para metricas agregadas, recortes temporais e exploracao de performance do pipeline.',
    route: '/analytics',
    family: 'analytical',
  },
  {
    title: 'ClickHouse',
    eyebrow: 'Exploracao analitica',
    description: 'Warehouse operacional com fonte, fallback, lag, SLO, dependencias e agregados sem consulta livre.',
    route: '/clickhouse',
    family: 'analytical',
  },
  {
    title: 'Quarentena',
    eyebrow: 'Qualidade e triagem',
    description: 'Superficie de triagem para registros bloqueados, motivos de validacao e proximas acoes operacionais.',
    route: '/quarantine',
    family: 'operational',
  },
  {
    title: 'ETL Explorer',
    eyebrow: 'Fluxos e lineage',
    description: 'Drilldown por job com upload, acquisition, batches, attempts, artefatos, warnings e audit refs.',
    route: '/etl-explorer',
    family: 'analytical',
  },
  {
    title: 'Event Log',
    eyebrow: 'Eventos do sistema',
    description: 'Timeline de eventos assincronos e sinais operacionais para investigacao rapida do pipeline.',
    route: '/events',
    family: 'system',
  },
  {
    title: 'Auditoria',
    eyebrow: 'Governanca e trilha',
    description: 'Consulta de acoes sensiveis, atores, recursos e contexto de requisicao para rastreabilidade forte.',
    route: '/audit',
    family: 'system',
  },
  {
    title: 'Operacoes Seguras',
    eyebrow: 'Governanca operacional',
    description: 'Wizard admin-only para retry, resolve e replay DLQ com motivo obrigatorio e idempotencia.',
    route: '/operations',
    family: 'system',
  },
  {
    title: 'Notificacoes',
    eyebrow: 'Inbox operacional',
    description: 'Centro de notificacoes in-app, canais de entrega e regras de eventos criticos.',
    route: '/notifications',
    family: 'system',
  },
  {
    title: 'Configuracoes',
    eyebrow: 'Workspace e integracoes',
    description: 'Configuracoes do workspace, adaptadores de backend, ambiente e preferencias operacionais.',
    route: '/settings',
    family: 'system',
  },
]

export const workspaceTopChips: { label: string; tone: 'ok' | 'warn' }[] = [
  { label: 'Dashboard API', tone: 'ok' },
  { label: 'Warehouse API', tone: 'ok' },
  { label: 'Lineage API', tone: 'ok' },
  { label: 'Public link', tone: 'ok' },
] as const

export const jobUiStates = [
  {
    value: 'pending',
    label: 'Pendente',
    intent: 'Aguardando inicio de processamento ou entrada na fila.',
  },
  {
    value: 'processing',
    label: 'Processando',
    intent: 'Execucao em andamento com progresso ativo e feedback operacional.',
  },
  {
    value: 'completed',
    label: 'Concluido',
    intent: 'Processamento finalizado com sucesso e pronto para consulta.',
  },
  {
    value: 'failed',
    label: 'Falhou',
    intent: 'Execucao interrompida por erro operacional ou limite de retries.',
  },
  {
    value: 'quarantined_with_warnings',
    label: 'Quarentena com alertas',
    intent: 'Job finalizado com registros sinalizados para triagem posterior.',
  },
] as const

export function getWorkspaceModule(route: WorkspaceRoute) {
  return workspaceModules.find((module) => module.route === route)
}

export function getVisibleWorkspaceNavGroups(role: 'operator' | 'admin' | 'service_account') {
  return workspaceNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly || role === 'admin'),
    }))
    .filter((group) => group.items.length > 0)
}
