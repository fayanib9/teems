'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Something went wrong</h2>
        <p className="text-text-secondary mb-6">An unexpected error occurred. Please try again.</p>
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </div>
  )
}
