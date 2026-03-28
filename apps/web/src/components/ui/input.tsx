import * as React from 'react'

import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid = false, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'input-shell',
        invalid &&
          'border-[color:rgb(224_92_92_/_0.7)] shadow-[0_0_0_1px_rgb(224_92_92_/_0.24)]',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  ),
)

Input.displayName = 'Input'
