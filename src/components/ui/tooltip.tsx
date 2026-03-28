'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type TooltipProps = {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({ content, children, position = 'top', className }: TooltipProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className={cn('relative inline-flex group', className)}>
      {children}
      <div
        className={cn(
          'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md whitespace-nowrap',
          'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
          'transition-all duration-150 delay-300',
          'pointer-events-none',
          positionClasses[position]
        )}
      >
        {content}
        <div
          className={cn(
            'absolute w-2 h-2 bg-gray-900 rotate-45',
            position === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1',
            position === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
            position === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1',
            position === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1'
          )}
        />
      </div>
    </div>
  )
}
