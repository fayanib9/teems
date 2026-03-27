import { getSession, hasPermission } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Settings } from 'lucide-react'

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) return null
  if (!hasPermission(session, 'settings', 'view')) redirect('/dashboard')

  return (
    <>
      <PageHeader title="Settings" description="System configuration" />

      <div className="space-y-6 max-w-2xl">
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">General</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-text-secondary">Organization</span>
              <span className="text-text-primary font-medium">Toada Consulting</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-text-secondary">Timezone</span>
              <span className="text-text-primary">Asia/Riyadh (GMT+3)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-text-secondary">Currency</span>
              <span className="text-text-primary">SAR</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-text-secondary">Language</span>
              <span className="text-text-primary">English</span>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">System Info</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-text-secondary">Version</span>
              <span className="text-text-primary">1.0.0</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-text-secondary">Database</span>
              <span className="text-text-primary">PostgreSQL</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
