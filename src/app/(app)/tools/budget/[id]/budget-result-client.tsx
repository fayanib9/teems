'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { ArrowLeft, TrendingUp } from 'lucide-react'

type BreakdownItem = { category: string; label: string; estimated_cost: number; percentage: number; notes: string }
type Benchmark = { label: string; value: string }

type Props = {
  budget: {
    id: number
    name: string
    total_estimated: number
    currency: string | null
    form_data: Record<string, unknown>
    breakdown: BreakdownItem[]
    benchmarks: Benchmark[]
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  venue: '#312C6A',
  catering: '#D97706',
  production: '#DC2626',
  branding: '#7C3AED',
  staffing: '#059669',
  marketing: '#2563EB',
  logistics: '#0891B2',
  technology: '#6366F1',
}

export function BudgetResultClient({ budget }: Props) {
  const currency = budget.currency || 'SAR'
  const total = budget.total_estimated / 100

  return (
    <>
      <PageHeader
        title={budget.name}
        description={`Estimated total: ${total.toLocaleString()} ${currency}`}
        actions={
          <Link href="/tools/budget" className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />Back to Budgets
          </Link>
        }
      />

      {/* Total */}
      <div className="bg-surface rounded-xl border border-border p-6 mb-6 text-center">
        <p className="text-sm text-text-tertiary mb-1">Estimated Total</p>
        <p className="text-3xl font-bold text-text-primary">{total.toLocaleString()} <span className="text-lg font-normal text-text-tertiary">{currency}</span></p>
      </div>

      {/* Benchmarks */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {budget.benchmarks.map((b, i) => (
          <div key={i} className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-tertiary mb-1">{b.label}</p>
            <p className="text-sm font-semibold text-text-primary">{b.value}</p>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary-500" />
            Cost Breakdown
          </h3>
        </div>

        {/* Visual bar chart */}
        <div className="p-5 space-y-3">
          {budget.breakdown.map((item) => (
            <div key={item.category}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-text-primary">{item.label}</span>
                <span className="text-sm text-text-secondary">{(item.estimated_cost / 100).toLocaleString()} {currency} ({item.percentage}%)</span>
              </div>
              <div className="h-3 bg-surface-tertiary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${item.percentage}%`, backgroundColor: CATEGORY_COLORS[item.category] || '#6B7280' }}
                />
              </div>
              {item.notes && <p className="text-xs text-text-tertiary mt-0.5">{item.notes}</p>}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
