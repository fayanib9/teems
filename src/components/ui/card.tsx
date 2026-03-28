import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  variant?: 'default' | 'interactive' | 'stat'
  className?: string
  onClick?: () => void
}

export function Card({ children, variant = 'default', className, onClick }: CardProps) {
  const base = 'bg-surface rounded-xl border border-border p-5 transition-all duration-200'

  const variants = {
    default: '',
    interactive: 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer',
    stat: 'hover:-translate-y-0.5 hover:shadow-md',
  }

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      className={cn(base, variants[variant], className)}
      onClick={onClick}
    >
      {children}
    </Tag>
  )
}
