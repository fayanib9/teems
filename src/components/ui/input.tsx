import { cn } from '@/lib/utils'
import { forwardRef, useId } from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id: propId, ...props }, ref) => {
    const generatedId = useId()
    const id = propId || generatedId
    const errorId = error ? `${id}-error` : undefined
    const hintId = hint && !error ? `${id}-hint` : undefined

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId || hintId || undefined}
          className={cn(
            'flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs text-red-500" role="alert" aria-live="polite">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="text-xs text-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
