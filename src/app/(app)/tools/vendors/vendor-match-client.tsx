'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Plus, GitCompare, Clock } from 'lucide-react'

type Match = {
  id: number
  criteria: { services_needed: string[]; event_type: string; attendees: number }
  created_at: Date | null
}

export function VendorMatchClient({ matches }: { matches: Match[] }) {
  const router = useRouter()

  return (
    <>
      <PageHeader
        title="Vendor Matcher"
        description="Find the best vendors for your event requirements"
        actions={
          <Link href="/tools/vendors/new" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors">
            <Plus className="h-4 w-4" />New Match
          </Link>
        }
      />

      {matches.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <GitCompare className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No vendor matches yet</h3>
          <p className="text-sm text-text-secondary mb-6">Match vendors from your directory against event requirements.</p>
          <Link href="/tools/vendors/new" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
            <Plus className="h-4 w-4" />Find Vendors
          </Link>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Services</th>
                <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Event Type</th>
                <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Attendees</th>
                <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {matches.map(m => (
                <tr key={m.id} onClick={() => router.push(`/tools/vendors/${m.id}`)} className="hover:bg-surface-secondary cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {m.criteria.services_needed.map((s: string) => (
                        <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary capitalize">{m.criteria.event_type}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{m.criteria.attendees?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                      <Clock className="h-3 w-3" />
                      {m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
