import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { SectionLabel, ShellPanel, StreamGateMark } from '@/components/app/brand'

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative isolate">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(circle_at_top_left,rgba(77,157,224,0.18),transparent_32%),radial-gradient(circle_at_65%_10%,rgba(60,207,207,0.12),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-40 panel-grid" />

        <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col px-6 py-6 lg:px-8 lg:py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <StreamGateMark />
              <div>
                <div className="text-sm font-bold tracking-[-0.03em]">
                  Stream<span className="font-normal text-[var(--text-dim)]">Gate</span>
                </div>
                <div className="text-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                  auth workspace
                </div>
              </div>
            </div>

            <Link
              to="/"
              className="hover-lift inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-[var(--text-soft)]"
            >
              <ArrowLeft className="size-4" />
              Voltar para a landpage
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
            <ShellPanel className="w-full max-w-[560px] bg-[linear-gradient(180deg,rgba(20,20,20,0.98),rgba(12,12,12,0.98))]">
              <div className="border-b border-white/8 px-6 py-6 sm:px-8">
                <SectionLabel>{eyebrow}</SectionLabel>
                <h1 className="mt-5 text-4xl font-semibold tracking-[-0.07em] sm:text-5xl">
                  {title}
                </h1>
                <p className="mt-4 max-w-[44ch] text-sm leading-7 text-[var(--text-dim)] sm:text-base">
                  {description}
                </p>
              </div>

              <div className="px-6 py-6 sm:px-8">{children}</div>

              {footer ? <div className="border-t border-white/8 px-6 py-5 sm:px-8">{footer}</div> : null}
            </ShellPanel>
          </div>
        </div>
      </div>
    </main>
  )
}
