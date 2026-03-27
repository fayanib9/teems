export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-surface-tertiary rounded w-1/3" />
        <div className="h-4 bg-surface-tertiary rounded w-1/4" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="animate-pulse bg-surface rounded-xl border border-border p-5 space-y-3">
            <div className="h-4 bg-surface-tertiary rounded w-2/3" />
            <div className="h-8 bg-surface-tertiary rounded w-1/3" />
          </div>
        ))}
      </div>
      <div className="animate-pulse bg-surface rounded-xl border border-border p-6 space-y-4">
        <div className="h-4 bg-surface-tertiary rounded w-1/4" />
        <div className="h-32 bg-surface-tertiary rounded" />
      </div>
    </div>
  )
}
