import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
          <FileQuestion className="h-8 w-8 text-primary-500" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Page not found</h2>
        <p className="text-text-secondary mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <Link href="/dashboard"><Button>Back to Dashboard</Button></Link>
      </div>
    </div>
  )
}
