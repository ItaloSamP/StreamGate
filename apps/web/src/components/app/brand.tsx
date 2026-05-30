import type { ReactNode } from 'react'
import { CircleDot } from 'lucide-react'

import { cn } from '@/lib/utils'

export function StreamGateMark() {
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

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-mono inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-[var(--text-faint)]">
      <CircleDot className="size-3 text-[var(--signal-teal)]" />
      {children}
    </div>
  )
}

export function ShellPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('panel-shell inset-noise overflow-hidden', className)}>{children}</div>
}
