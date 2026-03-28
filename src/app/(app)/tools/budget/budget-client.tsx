'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Plus, Calculator, Clock } from 'lucide-react'

type Budget = {
  id: number
  name: string
  total_estimated: number
  currency: string | null
  created_at: Date | null
}

export function BudgetClient({ budgets }: { budgets: Budget[] }) {
  const router = useRouter()

  return (
    <>
      <PageHeader
        title="Budget Calculator"
        description="Estimate event budgets with itemized breakdowns"
        actions={
          <Link
            href="/tools/budget/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Budget
          </Link>
        }
      />

      {budgets.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <Calculator className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No budgets yet</h3>
          <p className="text-sm text-text-secondary mb-6">Create your first budget estimate for an event.</p>
          <Link href="/tools/budget/new" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
            <Plus className="h-4 w-4" />
            Calculate Budget
          </Link>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Estimated Total</th>
                <th className="text-left text-xs font-medium text-text-tertiary uppercase tracking-wider px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {budgets.map((budget) => (
                <tr key={budget.id} onClick={() => router.push(`/tools/budget/${budget.id}`)} className="hover:bg-surface-secondary cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium text-text-primary">{budget.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">
                    {(budget.total_estimated / 100).toLocaleString()} {budget.currency || 'SAR'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                      <Clock className="h-3 w-3" />
                      {budget.created_at ? new Date(budget.created_at).toLocaleDateString() : '—'}
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
