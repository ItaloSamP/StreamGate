import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Eye,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { DashboardSurface } from '@/components/app/dashboard-surface'
import { SectionLabel, ShellPanel, StreamGateMark } from '@/components/app/brand'
import { Button } from '@/components/ui/button'

const valueBlocks = [
  {
    title: 'Centralize a operacao',
    copy: 'Tenha ingestao, processamento, filas, quarentena e auditoria na mesma leitura operacional.',
    icon: Workflow,
  },
  {
    title: 'Encontre gargalos cedo',
    copy: 'Veja onde jobs param, atrasam ou falham antes de virarem ruido para o time.',
    icon: Eye,
  },
  {
    title: 'Dê contexto para a empresa',
    copy: 'Transforme sinais tecnicos em visibilidade clara para operacao, tecnologia e lideranca.',
    icon: ShieldCheck,
  },
] as const

const problemSolution = [
  {
    problem: 'Pipelines espalhados em telas e ferramentas diferentes.',
    solution: 'O StreamGate concentra o que esta acontecendo no fluxo de dados em um unico workspace.',
  },
  {
    problem: 'Baixa visibilidade sobre falhas, filas e quarentena.',
    solution: 'A plataforma destaca risco operacional, status de jobs e impacto para o time.',
  },
  {
    problem: 'Dificuldade para explicar o estado do pipeline para a empresa.',
    solution: 'A leitura fica mais clara para quem opera e para quem precisa decidir.',
  },
] as const

const businessOutcomes = [
  'Mais clareza para agir quando algo sai do fluxo esperado.',
  'Menos tempo alternando entre operacao, monitoramento e trilhas.',
  'Mais confianca para empresas que dependem de dados em ritmo continuo.',
] as const

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(circle_at_top_left,rgba(77,157,224,0.18),transparent_32%),radial-gradient(circle_at_65%_10%,rgba(60,207,207,0.12),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-40 panel-grid" />

        <header className="sticky top-0 z-20 border-b border-white/8 bg-black/40 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1440px] items-center gap-6 px-6 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <StreamGateMark />
              <div>
                <div className="text-sm font-bold tracking-[-0.03em]">
                  Stream<span className="font-normal text-[var(--text-dim)]">Gate</span>
                </div>
                <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                  data operations platform
                </div>
              </div>
            </div>

            <nav className="hidden items-center gap-6 text-sm text-[var(--text-dim)] lg:flex">
              <a href="#produto" className="transition-colors hover:text-white">
                Produto
              </a>
              <a href="#resolve" className="transition-colors hover:text-white">
                O que resolve
              </a>
              <a href="#beneficios" className="transition-colors hover:text-white">
                Beneficios
              </a>
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <Button asChild variant="panel" size="sm">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild variant="inverted" size="sm">
                <Link to="/register">Cadastro</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-[1440px] px-6 pb-18 pt-14 lg:px-8 lg:pb-20 lg:pt-18">
          <div className="max-w-4xl">
            <SectionLabel>Plataforma para operacao de dados</SectionLabel>
            <h1 className="mt-6 max-w-[11ch] text-5xl font-semibold leading-none tracking-[-0.08em] sm:text-6xl lg:text-7xl">
              Visualize, controle e opere seus pipelines de dados.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--text-dim)] sm:text-lg">
              Monitore ingestao, jobs, filas, quarentena e trilhas de auditoria em um unico lugar.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-dim)]">
              O StreamGate foi pensado para empresas que precisam entender rapidamente o
              estado da operacao, agir sobre gargalos e dar visibilidade real ao fluxo de dados.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="inverted" size="xl">
                <Link to="/login">
                  Acesse sua dashboard
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="panel" size="xl">
                <Link to="/register">
                  Criar conta
                  <ChevronRight />
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {valueBlocks.map((block) => {
                const Icon = block.icon

                return (
                  <div key={block.title} className="border-l border-white/10 pl-4">
                    <div className="flex items-center gap-2 text-sm text-white">
                      <Icon className="size-4 text-[var(--signal-teal)]" />
                      <span>{block.title}</span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-dim)]">{block.copy}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="relative mt-12">
            <div className="pointer-events-none absolute inset-x-14 top-1/2 h-24 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(77,157,224,0.18),transparent_70%)] blur-3xl" />

            <div className="flex items-center justify-between gap-3 px-1">
              <div className="text-sm text-[var(--text-dim)]">
                Um recorte do workspace que o usuario encontra apos o login.
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-[var(--text-soft)]">
                <span className="size-2 rounded-full bg-[var(--signal-teal)]" />
                workspace protegido
              </div>
            </div>

            <div className="relative mt-4 overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,18,18,0.98),rgba(10,10,10,0.96))] p-2 sm:p-3">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-18 bg-[linear-gradient(90deg,rgba(10,10,10,0.96),rgba(10,10,10,0))]" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-18 bg-[linear-gradient(270deg,rgba(10,10,10,0.96),rgba(10,10,10,0))]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-[linear-gradient(180deg,rgba(10,10,10,0.42),rgba(10,10,10,0))]" />

              <div className="relative h-[150px] overflow-hidden rounded-[22px] border border-white/8 bg-black/30 sm:h-[180px] lg:h-[220px]">
                <div className="absolute left-1/2 top-1/2 w-[1140px] -translate-x-1/2 -translate-y-[32%] scale-[0.47] sm:w-[1240px] sm:scale-[0.52] lg:w-[1360px] lg:scale-[0.6]">
                  <div className="[mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
                    <DashboardSurface locked />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="produto" className="border-y border-white/8 bg-black/18">
          <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-8">
            <div className="max-w-3xl">
              <SectionLabel>O que o produto centraliza</SectionLabel>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
                Uma camada operacional para quem depende de pipelines saudaveis.
              </h2>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {valueBlocks.map((block) => {
                const Icon = block.icon

                return (
                  <ShellPanel key={block.title} className="h-full bg-[var(--surface-2)] p-6">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/4 text-[var(--signal-teal)]">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold tracking-[-0.05em]">{block.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--text-dim)]">{block.copy}</p>
                  </ShellPanel>
                )
              })}
            </div>
          </div>
        </section>

        <section id="resolve" className="mx-auto max-w-[1440px] px-6 py-18 lg:px-8 lg:py-22">
          <div className="max-w-3xl">
            <SectionLabel>O que o StreamGate resolve</SectionLabel>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
              Menos leitura fragmentada, mais decisao com contexto.
            </h2>
          </div>

          <div className="mt-10 grid gap-4">
            {problemSolution.map((item) => (
              <div
                key={item.problem}
                className="grid gap-4 rounded-[24px] border border-white/8 bg-[var(--surface-2)] px-5 py-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:px-6"
              >
                <div>
                  <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                    Problema
                  </div>
                  <p className="mt-2 text-base leading-7 text-white">{item.problem}</p>
                </div>
                <div>
                  <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                    Como o produto ajuda
                  </div>
                  <p className="mt-2 text-base leading-7 text-[var(--text-dim)]">{item.solution}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="beneficios" className="mx-auto max-w-[1440px] px-6 pb-20 lg:px-8 lg:pb-28">
          <ShellPanel className="overflow-hidden bg-[linear-gradient(135deg,rgba(77,157,224,0.13),rgba(10,10,10,0.2)_40%,rgba(60,207,207,0.08))]">
            <div className="grid gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8 lg:py-10">
              <div>
                <SectionLabel>O que empresas ganham</SectionLabel>
                <h2 className="mt-4 max-w-[16ch] text-3xl font-semibold tracking-[-0.06em] sm:text-4xl">
                  Um produto mais claro para operar dados com menos atrito.
                </h2>
                <div className="mt-6 flex flex-col gap-3">
                  {businessOutcomes.map((outcome) => (
                    <div key={outcome} className="flex items-start gap-3 text-sm leading-6 text-[var(--text-soft)]">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--signal-green)]" />
                      <span>{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3">
                <Button asChild variant="inverted" size="xl">
                  <Link to="/login">
                    Acesse sua dashboard
                    <ChevronRight />
                  </Link>
                </Button>
                <Button asChild variant="panel" size="xl">
                  <Link to="/register">Comecar cadastro</Link>
                </Button>
              </div>
            </div>
          </ShellPanel>
        </section>
      </div>
    </main>
  )
}
