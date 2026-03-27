import type { ReactNode } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  KeyRound,
  LockKeyhole,
  LogOut,
  Play,
  ShieldCheck,
  Sparkles,
  UserPlus2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

const statCards = [
  {
    label: 'Throughput ativo',
    value: '148',
    foot: 'jobs hoje',
    tone: 'var(--signal-blue)',
    tag: '+12.4%',
  },
  {
    label: 'Sucesso ETL',
    value: '98.7%',
    foot: 'semana atual',
    tone: 'var(--signal-green)',
    tag: 'steady',
  },
  {
    label: 'Fila protegida',
    value: '03',
    foot: 'itens aguardando',
    tone: 'var(--signal-teal)',
    tag: 'clean',
  },
] as const

const proofMetrics = [
  { value: '24/7', label: 'monitoramento do pipeline' },
  { value: 'RBAC', label: 'acesso por perfil e sessao' },
  { value: 'Audit', label: 'trilhas prontas para revisao' },
  { value: 'Live', label: 'telemetria operacional continua' },
] as const

const authPanels = [
  {
    eyebrow: 'Login',
    title: 'Entrar para liberar o workspace',
    copy:
      'Acesso ao dashboard, trilhas operacionais e paineis em tempo real fica disponivel apos autenticacao.',
    icon: KeyRound,
    fields: ['E-mail corporativo', 'Senha'],
    action: 'Entrar na operacao',
    tone: 'var(--signal-blue)',
  },
  {
    eyebrow: 'Cadastro',
    title: 'Criar conta com a estetica da operacao',
    copy:
      'Fluxo de onboarding com identidade visual consistente para novos operadores, gestores e analistas.',
    icon: UserPlus2,
    fields: ['Nome completo', 'E-mail', 'Senha'],
    action: 'Solicitar criacao',
    tone: 'var(--signal-teal)',
  },
  {
    eyebrow: 'Logout',
    title: 'Encerrar sessao com clareza e seguranca',
    copy:
      'Estado de saida preparado para informar sessao encerrada, ultimo acesso e atalho para retornar.',
    icon: LogOut,
    fields: ['Sessao atual', 'Dispositivo confiavel'],
    action: 'Ver estado de saida',
    tone: 'var(--signal-red)',
  },
] as const

const accessPoints = [
  'Landing publica com identidade do dashboard desde a primeira dobra',
  'Previa bloqueada do painel principal para gerar contexto antes do login',
  'Blocos prontos para reaproveitar em login, cadastro, logout e estados futuros',
] as const

function StreamGateMark() {
  return (
    <svg
      aria-hidden="true"
      className="size-9 text-white"
      viewBox="0 0 30 30"
      fill="none"
    >
      <line
        x1="1"
        y1="6"
        x2="14"
        y2="15"
        stroke="currentColor"
        strokeOpacity="0.38"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="1"
        y1="15"
        x2="14"
        y2="15"
        stroke="currentColor"
        strokeOpacity="0.38"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="1"
        y1="24"
        x2="14"
        y2="15"
        stroke="currentColor"
        strokeOpacity="0.38"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="14" cy="15" r="2" fill="currentColor" fillOpacity="0.72" />
      <line
        x1="14"
        y1="15"
        x2="29"
        y2="9"
        stroke="currentColor"
        strokeOpacity="0.16"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="14"
        y1="15"
        x2="29"
        y2="21"
        stroke="currentColor"
        strokeOpacity="0.16"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-[var(--text-faint)]">
      <CircleDot className="size-3 text-[var(--signal-teal)]" />
      {children}
    </div>
  )
}

function ShellPanel({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`panel-shell inset-noise overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

function NavGroup({
  label,
  items,
}: {
  label: string
  items: readonly [string, boolean][]
}) {
  return (
    <div>
      <div className="text-mono mb-2 px-3 text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
        {label}
      </div>
      <div className="space-y-1">
        {items.map(([item, active]) => (
          <div
            key={item}
            className={[
              'rounded-xl px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-[var(--surface-4)] text-white'
                : 'text-[var(--text-dim)] hover:bg-white/4 hover:text-[var(--text-soft)]',
            ].join(' ')}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniMeter({
  label,
  value,
  width,
  tone,
}: {
  label: string
  value: string
  width: string
  tone: string
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-dim)]">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
        <div className="h-full rounded-full" style={{ width, background: tone }} />
      </div>
    </div>
  )
}

function StatusChip({ label, tone }: { label: string; tone: string }) {
  return (
    <div
      className="text-mono rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em]"
      style={{
        color: tone,
        borderColor: 'rgb(255 255 255 / 0.08)',
        backgroundColor: 'rgb(255 255 255 / 0.03)',
      }}
    >
      {label}
    </div>
  )
}

function JobRow({
  id,
  file,
  progress,
  badge,
  tone,
}: {
  id: string
  file: string
  progress: string
  badge: string
  tone: string
}) {
  return (
    <tr className="border-t border-white/8">
      <td className="px-4 py-3 text-[var(--text-faint)]">{id}</td>
      <td className="px-4 py-3 text-white">{file}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/6">
            <div className="h-full rounded-full" style={{ width: progress, background: tone }} />
          </div>
          <span className="text-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-dim)]">
            {progress}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusChip label={badge} tone={tone} />
      </td>
    </tr>
  )
}

function LogEntry({
  time,
  label,
  copy,
  tone,
}: {
  time: string
  label: string
  copy: string
  tone: string
}) {
  return (
    <div className="flex gap-3 border-b border-white/8 pb-3 text-sm last:border-b-0 last:pb-0">
      <div className="text-mono min-w-16 text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
        {time}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: tone }}>
          {label}
        </div>
        <div className="mt-1 truncate text-[var(--text-dim)]">{copy}</div>
      </div>
    </div>
  )
}

function AuthPanel({
  eyebrow,
  title,
  copy,
  fields,
  action,
  icon: Icon,
  tone,
}: (typeof authPanels)[number]) {
  return (
    <ShellPanel className="h-full bg-[var(--surface-2)]">
      <div className="border-b border-white/8 px-5 py-4">
        <div className="flex items-center gap-2 text-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
          <Icon className="size-4" style={{ color: tone }} />
          {eyebrow}
        </div>
        <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em]">{title}</h3>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-dim)]">{copy}</p>
      </div>
      <div className="space-y-4 px-5 py-5">
        <div className="space-y-3">
          {fields.map((field) => (
            <div
              key={field}
              className="rounded-2xl border border-white/8 bg-[var(--surface-1)] px-4 py-3"
            >
              <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                {field}
              </div>
              <div className="mt-2 h-2 w-2/3 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <Button variant="panel" size="xl" className="flex-1">
            {action}
          </Button>
          <div
            className="rounded-2xl border px-3 py-2 text-mono text-[10px] uppercase tracking-[0.18em]"
            style={{
              color: tone,
              borderColor: 'rgb(255 255 255 / 0.08)',
            }}
          >
            ui state
          </div>
        </div>
      </div>
    </ShellPanel>
  )
}

function DashboardPreview() {
  return (
    <ShellPanel className="relative w-full max-w-[780px]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="grid min-h-[520px] md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="border-b border-white/8 bg-[var(--surface-1)] md:border-r md:border-b-0">
          <div className="flex items-center gap-3 border-b border-white/8 px-5 py-5">
            <StreamGateMark />
            <div>
              <div className="text-sm font-bold tracking-[-0.03em]">
                Stream<span className="font-normal text-[var(--text-dim)]">Gate</span>
              </div>
              <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                data pipeline . v1.0
              </div>
            </div>
          </div>
          <div className="space-y-6 px-3 py-5">
            <NavGroup
              label="Principal"
              items={[
                ['Dashboard', true],
                ['Upload', false],
                ['Jobs', false],
              ]}
            />
            <NavGroup
              label="Analise"
              items={[
                ['Analytics', false],
                ['Quarentena', false],
                ['ETL Explorer', false],
              ]}
            />
            <div className="rounded-2xl border border-white/8 bg-white/3 p-3">
              <div className="mb-3 flex items-center justify-between text-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-dim)]">
                <span>Session</span>
                <span className="text-[var(--signal-green)]">stable</span>
              </div>
              <div className="space-y-2">
                <MiniMeter label="CPU" value="42%" width="42%" tone="var(--signal-blue)" />
                <MiniMeter label="IO" value="68%" width="68%" tone="var(--signal-teal)" />
                <MiniMeter label="Queue" value="11%" width="11%" tone="var(--signal-purple)" />
              </div>
            </div>
          </div>
        </aside>

        <div className="bg-[var(--surface-0)]">
          <div className="flex flex-wrap items-center gap-3 border-b border-white/8 bg-[var(--surface-1)] px-5 py-4">
            <div>
              <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                Workspace
              </div>
              <div className="text-sm font-semibold tracking-[-0.03em]">
                Dashboard principal
              </div>
            </div>
            <div className="h-5 w-px bg-white/8" />
            <StatusChip label="workers 4 ativos" tone="var(--signal-green)" />
            <StatusChip label="fila 3 itens" tone="var(--signal-blue)" />
            <div className="ml-auto">
              <Button variant="panel" size="sm">
                Preview travado
              </Button>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid gap-3 md:grid-cols-3">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-white/8 bg-[var(--surface-2)] px-4 py-4"
                >
                  <div className="mb-3 h-0.5 rounded-full" style={{ background: card.tone }} />
                  <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-dim)]">
                    {card.label}
                  </div>
                  <div className="mt-3 text-[34px] font-light tracking-[-0.08em]">
                    {card.value}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-faint)]">
                    <span>{card.foot}</span>
                    <span style={{ color: card.tone }}>{card.tag}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.35fr_minmax(0,0.9fr)]">
              <div className="overflow-hidden rounded-2xl border border-white/8 bg-[var(--surface-2)]">
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold">Pipeline de jobs</div>
                    <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                      RabbitMQ . ClickHouse . observability
                    </div>
                  </div>
                  <StatusChip label="live" tone="var(--signal-green)" />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[var(--surface-1)] text-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                      <tr>
                        <th className="px-4 py-3 font-normal">ID</th>
                        <th className="px-4 py-3 font-normal">Arquivo</th>
                        <th className="px-4 py-3 font-normal">Progresso</th>
                        <th className="px-4 py-3 font-normal">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-[13px] text-[var(--text-soft)]">
                      <JobRow
                        id="#0441"
                        file="vendas_q4.csv"
                        progress="67%"
                        badge="processing"
                        tone="var(--signal-blue)"
                      />
                      <JobRow
                        id="#0440"
                        file="logs_app.json"
                        progress="42%"
                        badge="processing"
                        tone="var(--signal-teal)"
                      />
                      <JobRow
                        id="#0439"
                        file="catalog_sku.csv"
                        progress="100%"
                        badge="completed"
                        tone="var(--signal-green)"
                      />
                      <JobRow
                        id="#0437"
                        file="users_export.json"
                        progress="100%"
                        badge="quarantined"
                        tone="var(--signal-purple)"
                      />
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/8 bg-[var(--surface-2)]">
                  <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                    <div className="text-sm font-semibold">Acesso bloqueado</div>
                    <LockKeyhole className="size-4 text-[var(--signal-yellow)]" />
                  </div>
                  <div className="space-y-4 px-4 py-4">
                    <p className="max-w-sm text-sm leading-6 text-[var(--text-dim)]">
                      O dashboard completo segue este mesmo layout. A abertura real
                      da area acontece depois do login.
                    </p>
                    <div className="rounded-2xl border border-dashed border-white/14 bg-white/4 px-4 py-4">
                      <div className="text-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-faint)]">
                        Gate
                      </div>
                      <div className="mt-2 text-lg font-semibold tracking-[-0.04em]">
                        Sessao obrigatoria para continuar
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="inverted" size="sm">
                          Entrar
                        </Button>
                        <Button variant="panel" size="sm">
                          Criar conta
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[var(--surface-2)] px-4 py-4">
                  <div className="mb-4 text-sm font-semibold">Event log</div>
                  <div className="space-y-3">
                    <LogEntry
                      time="14:32:07"
                      label="upload.received"
                      copy="JB-0441 . vendas_q4_2024_full.csv . MinIO OK"
                      tone="var(--signal-blue)"
                    />
                    <LogEntry
                      time="14:31:40"
                      label="etl.job.completed"
                      copy="JB-0438 . financeiro_q3.xlsx . 0 erros"
                      tone="var(--signal-green)"
                    />
                    <LogEntry
                      time="14:30:11"
                      label="validation.failed"
                      copy="JB-0437 . 7 records enviados a quarentena"
                      tone="var(--signal-yellow)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(10,10,10,0.08),rgba(10,10,10,0.62))]">
        <div className="rounded-full border border-white/12 bg-black/72 px-5 py-3 text-mono text-[11px] uppercase tracking-[0.22em] text-white/82 backdrop-blur-sm">
          Preview da dashboard liberado apos login
        </div>
      </div>
    </ShellPanel>
  )
}

function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(circle_at_top_left,rgba(77,157,224,0.18),transparent_32%),radial-gradient(circle_at_65%_10%,rgba(60,207,207,0.12),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-40 panel-grid" />

        <header className="sticky top-0 z-20 border-b border-white/8 bg-black/40 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-6 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <StreamGateMark />
              <div>
                <div className="text-sm font-bold tracking-[-0.03em]">
                  Stream<span className="font-normal text-[var(--text-dim)]">Gate</span>
                </div>
                <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                  public access . ui system
                </div>
              </div>
            </div>

            <nav className="hidden items-center gap-6 text-sm text-[var(--text-dim)] lg:flex">
              <a href="#overview" className="transition-colors hover:text-white">
                Plataforma
              </a>
              <a href="#acesso" className="transition-colors hover:text-white">
                Acesso
              </a>
              <a href="#preview" className="transition-colors hover:text-white">
                Dashboard
              </a>
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="panel" size="sm">
                Login
              </Button>
              <Button variant="inverted" size="sm">
                Cadastro
              </Button>
              <Button variant="ghost" size="sm" className="border border-white/8 bg-white/3">
                Logout
              </Button>
            </div>
          </div>
        </header>

        <section className="mx-auto grid max-w-[1400px] gap-12 px-6 pb-18 pt-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(620px,1fr)] lg:px-8 lg:pb-24 lg:pt-18">
          <div className="flex flex-col justify-center">
            <SectionLabel>Landing principal do produto</SectionLabel>
            <div className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-sm text-[var(--text-soft)]">
              <Sparkles className="size-4 text-[var(--signal-teal)]" />
              Inspirada pelo ritmo premium de crypto.com, mas fiel ao prototipo StreamGate
            </div>
            <h1 className="mt-6 max-w-[12ch] text-5xl font-semibold leading-none tracking-[-0.08em] sm:text-6xl lg:text-7xl">
              Controle streams, jobs e acesso com uma interface unica.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[var(--text-dim)] sm:text-lg">
              Esta e a tela principal publica do projeto. Ela apresenta o site,
              organiza entrada e cadastro e entrega uma previa real da dashboard
              que so abre depois do login.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="inverted" size="xl">
                Entrar agora
                <ArrowRight />
              </Button>
              <Button variant="panel" size="xl">
                Criar conta
                <UserPlus2 />
              </Button>
              <Button
                variant="ghost"
                size="xl"
                className="rounded-xl border border-white/8 bg-white/3"
              >
                Ver preview
                <Play />
              </Button>
              <Button variant="ghost" size="xl" className="rounded-xl border border-white/8 bg-white/3">
                Simular logout
                <LogOut />
              </Button>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4 backdrop-blur-sm"
                >
                  <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                    {card.label}
                  </div>
                  <div className="mt-2 text-3xl font-light tracking-[-0.08em]">
                    {card.value}
                  </div>
                  <div className="mt-2 text-sm text-[var(--text-dim)]">{card.foot}</div>
                </div>
              ))}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {accessPoints.map((point) => (
                <div key={point} className="flex items-start gap-3 text-sm leading-6 text-[var(--text-soft)]">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--signal-green)]" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div id="preview" className="flex items-center justify-center">
            <DashboardPreview />
          </div>
        </section>

        <section id="overview" className="border-y border-white/8 bg-black/20">
          <div className="mx-auto grid max-w-[1400px] gap-6 px-6 py-8 lg:grid-cols-[1.1fr_repeat(4,1fr)] lg:px-8">
            <div>
              <SectionLabel>Camada publica</SectionLabel>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em]">
                A mesma assinatura visual da dashboard, agora aplicada na entrada do produto.
              </h2>
            </div>
            {proofMetrics.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                <div className="text-mono text-[11px] uppercase tracking-[0.2em] text-[var(--signal-blue)]">
                  {item.value}
                </div>
                <div className="mt-2 text-sm leading-6 text-[var(--text-dim)]">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="acesso" className="mx-auto max-w-[1400px] px-6 py-18 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <SectionLabel>Fluxos base</SectionLabel>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
              Login, cadastro e logout ja entram no projeto com o mesmo DNA visual.
            </h2>
            <p className="mt-5 text-base leading-8 text-[var(--text-dim)]">
              Em vez de telas soltas, deixei os estados principais organizados
              como blocos de interface do proprio sistema. Isso facilita evoluir
              para paginas completas depois sem quebrar a consistencia.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {authPanels.map((panel) => (
              <AuthPanel key={panel.eyebrow} {...panel} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1400px] px-6 pb-20 lg:px-8 lg:pb-28">
          <ShellPanel className="overflow-hidden bg-[linear-gradient(135deg,rgba(77,157,224,0.13),rgba(10,10,10,0.2)_40%,rgba(60,207,207,0.08))]">
            <div className="grid gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8 lg:py-10">
              <div>
                <SectionLabel>Proximo passo</SectionLabel>
                <h2 className="mt-4 max-w-[16ch] text-3xl font-semibold tracking-[-0.06em] sm:text-4xl">
                  A fundacao visual da UI agora pode ser expandida tela por tela.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-soft)]">
                  Toda nova feature pode reutilizar este mesmo vocabulario:
                  shell escuro, tipografia operacional, paineis de alta
                  densidade e estados de acesso claros.
                </p>
              </div>
              <div className="flex flex-col justify-center gap-3">
                <Button variant="inverted" size="xl">
                  Seguir para dashboard
                  <ChevronRight />
                </Button>
                <Button variant="panel" size="xl">
                  Modelar tela de login completa
                  <ShieldCheck />
                </Button>
              </div>
            </div>
          </ShellPanel>
        </section>
      </div>
    </main>
  )
}

export default App
