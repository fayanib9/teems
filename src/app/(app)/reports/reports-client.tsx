'use client'

import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import {
  CalendarDays, CheckSquare, Building2, Truck, Mic, Presentation,
  FileText, ClipboardCheck, Download, BarChart3, PieChart,
} from 'lucide-react'

type Props = {
  summary: {
    events: number
    tasks: number
    tasksDone: number
    clients: number
    vendors: number
    speakers: number
    exhibitors: number
    documents: number
    approvals: number
  }
  eventStatuses: { status: string; count: number }[]
  taskStatuses: { status: string; count: number }[]
  taskPriorities: { priority: string; count: number }[]
  approvalStatuses: { status: string; count: number }[]
  eventsByMonth: { month: string; count: number }[]
}

const EVENT_STATUS_COLORS: Record<string, string> = {
  draft: '#9CA3AF',
  planning: '#3B82F6',
  confirmed: '#312C6A',
  in_progress: '#F59E0B',
  completed: '#10B981',
  cancelled: '#EF4444',
  postponed: '#F97316',
}

const TASK_STATUS_COLORS: Record<string, string> = {
  todo: '#9CA3AF',
  in_progress: '#3B82F6',
  in_review: '#312C6A',
  blocked: '#EF4444',
  done: '#10B981',
  cancelled: '#6B7280',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#9CA3AF',
  medium: '#3B82F6',
  high: '#F59E0B',
  urgent: '#EF4444',
}

const APPROVAL_STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  in_review: '#3B82F6',
  approved: '#10B981',
  rejected: '#EF4444',
  cancelled: '#6B7280',
}

function BarChart({ data, colorMap, label }: { data: { key: string; count: number }[]; colorMap: Record<string, string>; label: string }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="space-y-2">
      {data.map(d => (
        <div key={d.key} className="flex items-center gap-3">
          <span className="text-xs text-text-secondary w-24 truncate capitalize">{d.key.replace(/_/g, ' ')}</span>
          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(d.count / max) * 100}%`, backgroundColor: colorMap[d.key] || '#9CA3AF', minWidth: d.count > 0 ? '8px' : '0' }}
            />
          </div>
          <span className="text-xs font-medium text-text-primary w-8 text-right">{d.count}</span>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ data, colorMap }: { data: { key: string; count: number }[]; colorMap: Record<string, string> }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  if (total === 0) return <p className="text-sm text-text-tertiary text-center py-8">No data</p>

  let accumulated = 0
  const segments = data.filter(d => d.count > 0).map(d => {
    const start = accumulated
    const pct = (d.count / total) * 100
    accumulated += pct
    return { ...d, start, pct }
  })

  // Build conic-gradient
  const gradientParts = segments.map(s =>
    `${colorMap[s.key] || '#9CA3AF'} ${s.start}% ${s.start + s.pct}%`
  )
  const gradient = `conic-gradient(${gradientParts.join(', ')})`

  return (
    <div className="flex items-center gap-6">
      <div
        className="w-28 h-28 rounded-full shrink-0 relative"
        style={{ background: gradient }}
      >
        <div className="absolute inset-3 bg-surface rounded-full flex items-center justify-center">
          <span className="text-lg font-bold text-text-primary">{total}</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {segments.map(s => (
          <div key={s.key} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorMap[s.key] || '#9CA3AF' }} />
            <span className="text-xs text-text-secondary capitalize">{s.key.replace(/_/g, ' ')}</span>
            <span className="text-xs font-medium text-text-primary">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MonthChart({ data }: { data: { month: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  if (data.length === 0) return <p className="text-sm text-text-tertiary text-center py-8">No events in the last 6 months</p>

  return (
    <div className="flex items-end gap-2 h-32">
      {data.map(d => {
        const height = (d.count / max) * 100
        const monthLabel = new Date(d.month + '-01').toLocaleDateString('en-US', { month: 'short' })
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-medium text-text-primary">{d.count}</span>
            <div className="w-full bg-gray-100 rounded-t-md relative" style={{ height: '100px' }}>
              <div
                className="absolute bottom-0 w-full bg-primary-500 rounded-t-md transition-all"
                style={{ height: `${height}%`, minHeight: d.count > 0 ? '4px' : '0' }}
              />
            </div>
            <span className="text-[10px] text-text-tertiary">{monthLabel}</span>
          </div>
        )
      })}
    </div>
  )
}

export function ReportsClient({ summary, eventStatuses, taskStatuses, taskPriorities, approvalStatuses, eventsByMonth }: Props) {
  function exportCSV() {
    const rows = [
      ['Metric', 'Value'],
      ['Total Events', summary.events],
      ['Total Tasks', summary.tasks],
      ['Completed Tasks', summary.tasksDone],
      ['Clients', summary.clients],
      ['Vendors', summary.vendors],
      ['Speakers', summary.speakers],
      ['Exhibitors', summary.exhibitors],
      ['Documents', summary.documents],
      ['Approvals', summary.approvals],
      [''],
      ['Event Statuses'],
      ...eventStatuses.map(r => [r.status, r.count]),
      [''],
      ['Task Statuses'],
      ...taskStatuses.map(r => [r.status, r.count]),
      [''],
      ['Task Priorities'],
      ...taskPriorities.map(r => [r.priority, r.count]),
    ]
    const csv = rows.map(r => Array.isArray(r) ? r.join(',') : r).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `teems-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const taskCompletion = summary.tasks > 0 ? Math.round((summary.tasksDone / summary.tasks) * 100) : 0

  return (
    <>
      <PageHeader
        title="Reports"
        description="System-wide statistics and insights"
        actions={<Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4" /> Export CSV</Button>}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Events" value={summary.events} icon={CalendarDays} />
        <StatCard title="Tasks" value={summary.tasks} subtitle={`${taskCompletion}% complete`} icon={CheckSquare} />
        <StatCard title="Clients" value={summary.clients} icon={Building2} />
        <StatCard title="Vendors" value={summary.vendors} icon={Truck} />
        <StatCard title="Documents" value={summary.documents} icon={FileText} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Event Status */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-4 w-4 text-text-tertiary" />
            <h3 className="text-sm font-semibold text-text-primary">Event Status Distribution</h3>
          </div>
          <DonutChart
            data={eventStatuses.map(s => ({ key: s.status, count: s.count }))}
            colorMap={EVENT_STATUS_COLORS}
          />
        </div>

        {/* Task Status */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-text-tertiary" />
            <h3 className="text-sm font-semibold text-text-primary">Task Status Breakdown</h3>
          </div>
          <BarChart
            data={taskStatuses.map(s => ({ key: s.status, count: s.count }))}
            colorMap={TASK_STATUS_COLORS}
            label="Tasks"
          />
        </div>

        {/* Task Priorities */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-4 w-4 text-text-tertiary" />
            <h3 className="text-sm font-semibold text-text-primary">Task Priorities</h3>
          </div>
          <DonutChart
            data={taskPriorities.map(s => ({ key: s.priority, count: s.count }))}
            colorMap={PRIORITY_COLORS}
          />
        </div>

        {/* Approval Status */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="h-4 w-4 text-text-tertiary" />
            <h3 className="text-sm font-semibold text-text-primary">Approval Status</h3>
          </div>
          <BarChart
            data={approvalStatuses.map(s => ({ key: s.status, count: s.count }))}
            colorMap={APPROVAL_STATUS_COLORS}
            label="Approvals"
          />
        </div>
      </div>

      {/* Events Timeline */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="h-4 w-4 text-text-tertiary" />
          <h3 className="text-sm font-semibold text-text-primary">Events by Month (Last 6 Months)</h3>
        </div>
        <MonthChart data={eventsByMonth} />
      </div>
    </>
  )
}
