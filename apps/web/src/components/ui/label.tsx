import type { LabelHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'text-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-faint)]',
        className,
      )}
      {...props}
    />
  )
}
