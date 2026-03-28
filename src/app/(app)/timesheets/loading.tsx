import { SkeletonTable } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <SkeletonTable cols={7} />
    </div>
  )
}
