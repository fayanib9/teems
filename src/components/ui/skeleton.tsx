import { cn } from '@/lib/utils'

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-surface-tertiary rounded',
        className
      )}
    />
  )
}

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-4 rounded-md bg-surface-tertiary animate-shimmer',
        className
      )}
    />
  )
}

function SkeletonAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-10 w-10 rounded-full bg-surface-tertiary animate-shimmer',
        className
      )}
    />
  )
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  const widths = ['w-full', 'w-4/5', 'w-3/5']
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} className={widths[i % widths.length]} />
      ))}
    </div>
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-surface rounded-xl border border-border p-5 space-y-3', className)}>
      <Skeleton className="h-40 w-full rounded-lg" />
      <SkeletonText lines={3} />
    </div>
  )
}

function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('bg-surface rounded-xl border border-border overflow-hidden', className)}>
      <div className="border-b border-border bg-surface-secondary px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 py-3 flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonLine key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonStats({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <SkeletonLine className="h-3 w-2/3" />
              <SkeletonLine className="h-7 w-1/3" />
              <SkeletonLine className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export { Skeleton, SkeletonLine, SkeletonAvatar, SkeletonText, SkeletonCard, SkeletonTable, SkeletonStats }
