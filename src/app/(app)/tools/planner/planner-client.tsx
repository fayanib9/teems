'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Plus, FileText, Clock, BarChart3 } from 'lucide-react'

type Plan = {
  id: number
  name: string
  client_name: string
  template_used: string | null
  complexity_score: number | null
  status: string | null
  version: number
  created_at: Date | null
  creator_name: string | null
}

export function PlannerClient({ plans }: { plans: Plan[] }) {
  const router = useRouter()

  function getStatusColor(status: string | null) {
    switch (status) {
      case 'generated': return 'bg-blue-100 text-blue-700'
      case 'active': return 'bg-green-100 text-green-700'
      case 'completed': return 'bg-gray-100 text-gray-700'
      case 'archived': return 'bg-amber-100 text-amber-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  function getComplexityColor(score: number | null) {
    if (!score) return 'text-gray-400'
    if (score < 30) return 'text-green-600'
    if (score < 60) return 'text-amber-600'
    if (score < 80) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <>
      <PageHeader
        title="Plan Generator"
        description="Generate comprehensive project plans from event parameters"
        actions={
          <Link
            href="/tools/planner/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Plan
          </Link>
        }
      />

      {plans.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <FileText className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No plans yet</h3>
          <p className="text-sm text-text-secondary mb-6">
            Create your first project plan by filling out the event questionnaire.
          </p>
          <Link
            href="/tools/planner/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Generate Plan
          </Link>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Plan</th>
                <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Client</th>
                <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Template</th>
                <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Complexity</th>
                <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {plans.map((plan) => (
                <tr
                  key={plan.id}
                  onClick={() => router.push(`/tools/planner/${plan.id}`)}
                  className="hover:bg-surface-secondary cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary-500" />
                      <span className="text-sm font-medium text-text-primary">{plan.name}</span>
                      {plan.version > 1 && (
                        <span className="text-xs text-text-tertiary">v{plan.version}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{plan.client_name}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{plan.template_used || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className={`h-3.5 w-3.5 ${getComplexityColor(plan.complexity_score)}`} />
                      <span className={`text-sm font-medium ${getComplexityColor(plan.complexity_score)}`}>
                        {plan.complexity_score ?? '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(plan.status)}`}>
                      {plan.status || 'generated'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                      <Clock className="h-3 w-3" />
                      {plan.created_at ? new Date(plan.created_at).toLocaleDateString() : '—'}
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
