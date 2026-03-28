'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  LayoutGrid, TrendingUp, AlertTriangle, XCircle, DollarSign,
  Search, CheckSquare, Clock, Target, Percent,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

type PortfolioEvent = {
  id: number
  title: string
  slug: string
  status: string
  priority: string | null
  start_date: Date | null
  end_date: Date | null
  budget_estimated: number | null
  budget_actual: number | null
  event_type_name: string | null
  client_name: string | null
  task_total: number
  task_done: number
  task_overdue: number
  risk_level: string
  budget_used_pct: number
  rag: 'green' | 'amber' | 'red'
}

type Summary = {
  total: number
  on_track: number
  at_risk: number
  critical: number
  over_budget: number
}

type KPIs = {
  totalEstimated: number
  totalActual: number
  budgetVariancePct: number
  taskCompletionRate: number
  onTimeDelivery: number
  totalOverdue: number
  activeEvents: number
  completedEvents: number
}

type Props = {
  portfolio: PortfolioEvent[]
  summary: Summary
  kpis: KPIs
}

const ragColors = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
}

const ragBadgeColors = {
  green: 'green' as const,
  amber: 'amber' as const,
  red: 'red' as const,
}

const riskBadgeColors: Record<string, 'green' | 'blue' | 'amber' | 'red'> = {
  low: 'green',
  medium: 'blue',
  high: 'amber',
  critical: 'red',
}

export function PortfolioClient({ portfolio, summary, kpis }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [ragFilter, setRagFilter] = useState<string | null>(null)

  const filtered = portfolio.filter(e => {
    const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase())
    const matchesRag = !ragFilter || e.rag === ragFilter
    return matchesSearch && matchesRag
  })

  return (
    <>
      <PageHeader
        title="Portfolio Dashboard"
        description="ePMO overview of all events with RAG status indicators"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard title="Total Events" value={summary.total} icon={LayoutGrid} />
        <StatCard title="On Track" value={summary.on_track} icon={TrendingUp} />
        <StatCard title="At Risk" value={summary.at_risk} icon={AlertTriangle} />
        <StatCard title="Critical / Over Budget" value={summary.critical + summary.over_budget} icon={XCircle} />
      </div>

      {/* KPI Dashboard */}
      <div className="bg-surface rounded-xl border border-border p-5 mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Portfolio KPIs</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <KPIGauge label="Task Completion" value={kpis.taskCompletionRate} unit="%" color={kpis.taskCompletionRate >= 80 ? 'green' : kpis.taskCompletionRate >= 50 ? 'amber' : 'red'} />
          <KPIGauge label="On-Time Delivery" value={kpis.onTimeDelivery} unit="%" color={kpis.onTimeDelivery >= 90 ? 'green' : kpis.onTimeDelivery >= 70 ? 'amber' : 'red'} />
          <KPIGauge label="Budget Variance" value={kpis.budgetVariancePct} unit="%" color={kpis.budgetVariancePct <= 0 ? 'green' : kpis.budgetVariancePct <= 10 ? 'amber' : 'red'} />
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(kpis.totalEstimated)}</p>
            <p className="text-[11px] text-text-tertiary mt-1">Total Budget (Est.)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">{kpis.totalOverdue}</p>
            <p className="text-[11px] text-text-tertiary mt-1">Overdue Tasks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">{kpis.activeEvents}</p>
            <p className="text-[11px] text-text-tertiary mt-1">Active Events</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex gap-1">
          {[null, 'green', 'amber', 'red'].map(r => (
            <button
              key={r ?? 'all'}
              onClick={() => setRagFilter(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                ragFilter === r
                  ? 'bg-primary-50 text-primary-700'
                  : 'bg-surface-tertiary text-text-secondary hover:text-text-primary'
              }`}
            >
              {r === null ? 'All' : r === 'green' ? 'On Track' : r === 'amber' ? 'At Risk' : 'Critical'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No events found"
          description="No events match your current filters."
        />
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left px-4 py-3 font-medium text-text-secondary w-8">RAG</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Event</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Dates</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Budget (Est)</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Tasks</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Risk</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(event => (
                  <tr
                    key={event.id}
                    onClick={() => router.push(`/events/${event.id}`)}
                    className="border-b border-border-light hover:bg-surface-secondary cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className={`h-3 w-3 rounded-full ${ragColors[event.rag]}`} title={event.rag.toUpperCase()} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary">{event.title}</div>
                      {event.client_name && (
                        <div className="text-xs text-text-tertiary">{event.client_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge type="event" value={event.status} />
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {formatDate(event.start_date)}
                      {event.end_date && <span className="text-text-tertiary"> — {formatDate(event.end_date)}</span>}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {formatCurrency(event.budget_estimated)}
                      {event.budget_used_pct > 0 && (
                        <span className={`text-xs ml-1 ${event.budget_used_pct > 100 ? 'text-red-600' : event.budget_used_pct > 80 ? 'text-amber-600' : 'text-text-tertiary'}`}>
                          ({event.budget_used_pct}%)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-text-primary">{event.task_done}/{event.task_total}</span>
                      {event.task_overdue > 0 && (
                        <span className="text-xs text-red-600 ml-1">({event.task_overdue} overdue)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={riskBadgeColors[event.risk_level] || 'gray'}>
                        {event.risk_level}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

function KPIGauge({ label, value, unit, color }: { label: string; value: number; unit: string; color: 'green' | 'amber' | 'red' }) {
  const colorClasses = {
    green: 'text-green-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  }
  const bgClasses = {
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }
  return (
    <div className="text-center">
      <div className="relative inline-flex items-center justify-center w-16 h-16 mb-2">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" strokeWidth="4" className="stroke-surface-tertiary" />
          <circle
            cx="32" cy="32" r="28" fill="none" strokeWidth="4"
            className={bgClasses[color]}
            style={{
              strokeDasharray: `${Math.min(Math.abs(value), 100) * 1.76} 176`,
              strokeLinecap: 'round',
            }}
            stroke="currentColor"
          />
        </svg>
        <span className={`absolute text-sm font-bold ${colorClasses[color]}`}>
          {value}{unit}
        </span>
      </div>
      <p className="text-[11px] text-text-tertiary">{label}</p>
    </div>
  )
}
