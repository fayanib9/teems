'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Plus, ShieldAlert, Clock } from 'lucide-react'

type Assessment = {
  id: number
  name: string
  overall_risk_level: string
  score: number | null
  created_at: Date | null
}

function getLevelColor(level: string) {
  switch (level) {
    case 'low': return 'bg-green-100 text-green-700'
    case 'medium': return 'bg-amber-100 text-amber-700'
    case 'high': return 'bg-orange-100 text-orange-700'
    case 'critical': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export function RiskClient({ assessments }: { assessments: Assessment[] }) {
  const router = useRouter()

  return (
    <>
      <PageHeader
        title="Risk Assessor"
        description="Analyze event parameters to identify and mitigate risks"
        actions={
          <Link href="/tools/risks/new" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors">
            <Plus className="h-4 w-4" />New Assessment
          </Link>
        }
      />

      {assessments.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <ShieldAlert className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No assessments yet</h3>
          <p className="text-sm text-text-secondary mb-6">Analyze event parameters to identify potential risks.</p>
          <Link href="/tools/risks/new" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
            <Plus className="h-4 w-4" />Assess Risks
          </Link>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Assessment</th>
                <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Risk Level</th>
                <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Score</th>
                <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assessments.map(a => (
                <tr key={a.id} onClick={() => router.push(`/tools/risks/${a.id}`)} className="hover:bg-surface-secondary cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-text-primary">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getLevelColor(a.overall_risk_level)}`}>
                      {a.overall_risk_level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">{a.score ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                      <Clock className="h-3 w-3" />
                      {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
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
