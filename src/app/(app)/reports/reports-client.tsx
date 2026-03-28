'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  CalendarDays, CheckSquare, DollarSign, Users, TrendingUp,
  AlertTriangle, Star, Clock, BarChart3, Activity,
  ChevronDown, Loader2,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────

type EventOption = { id: number; title: string; status: string }

type PortfolioData = {
  events_by_status: { status: string; count: number }[]
  total_events: number
  revenue_pipeline: { status: string; total_budget: string | null }[]
  task_stats: { total: number; completed: number; completion_rate: number; overdue: number }
  resource_utilization: { total_hours: number; active_users: number; avg_hours_per_user: number }
  vendor_performance: { avg_quality: number; avg_timeliness: number; avg_communication: number; avg_value: number; avg_overall: number; total_ratings: number }
  client_satisfaction: { avg_nps: number; avg_overall_rating: number; total_responses: number }
  budget_summary: { total_estimated: number; total_actual: number; variance: number }
  events: { id: number; title: string; status: string; start_date: string | null; end_date: string | null; budget_estimated: number | null; budget_actual: number | null; completion_percentage: number | null; health_score: string | null }[]
}

type EventReportData = {
  event: { id: number; title: string; status: string; start_date: string | null; end_date: string | null; venue_name: string | null; health_score: string | null; expected_attendees: number | null }
  task_completion: { total: number; completed: number; percentage: number }
  budget: { estimated: number; actual: number; variance: number; expense_count: number }
  team_utilization: { total_hours: number; members: { user_id: number; name: string; hours: number }[] }
  vendor_summary: { status: string; count: number }[]
  attendee_stats: { total: number; registered: number; checked_in: number; cancelled: number; no_show: number }
  risk_count: number
  lessons_learned_count: number
  feedback: { avg_nps: number; avg_rating: number; response_count: number }
}

type UtilizationUser = { user_id: number; name: string; total_hours: number; billable_hours: number; avg_weekly_hours: number; entry_count: number }
type EventAllocation = { user_id: number; name: string; event_id: number | null; event_title: string; hours: number }

type UtilizationData = {
  date_range: { from: string | null; to: string | null; weeks: number }
  users: UtilizationUser[]
  by_event: EventAllocation[]
  over_allocated: UtilizationUser[]
}

type Props = {
  events: EventOption[]
}

// ─── Tabs ────────────────────────────────────────────────────

const TABS = [
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'event', label: 'Event' },
  { key: 'utilization', label: 'Utilization' },
] as const

type TabKey = typeof TABS[number]['key']

// ─── Helpers ─────────────────────────────────────────────────

const HEALTH_COLORS: Record<string, string> = {
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
}

function HealthBadge({ score }: { score: string | null }) {
  const cls = HEALTH_COLORS[score ?? ''] ?? 'bg-gray-100 text-gray-600'
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${cls}`}>{score ?? 'N/A'}</span>
}

function ProgressBar({ value, max, color = 'bg-primary-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-text-tertiary text-center py-12">{message}</p>
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 text-primary-500 animate-spin" />
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────

export function ReportsClient({ events: eventOptions }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('portfolio')

  return (
    <>
      <PageHeader
        title="Executive Reports"
        description="Portfolio analytics, event performance, and resource utilization"
      />

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-primary-600'
                : 'text-text-tertiary hover:text-text-primary'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'portfolio' && <PortfolioTab />}
      {activeTab === 'event' && <EventTab eventOptions={eventOptions} />}
      {activeTab === 'utilization' && <UtilizationTab />}
    </>
  )
}

// ─── Portfolio Tab ───────────────────────────────────────────

function PortfolioTab() {
  const [data, setData] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reports/portfolio')
      .then((r) => r.json())
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (!data) return <EmptyState message="Failed to load portfolio data" />

  const budgetVariancePct = data.budget_summary.total_estimated > 0
    ? Math.round(((data.budget_summary.total_estimated - data.budget_summary.total_actual) / data.budget_summary.total_estimated) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={data.total_events}
          subtitle={`${data.events_by_status.find((e) => e.status === 'in_progress')?.count ?? 0} active`}
          icon={CalendarDays}
        />
        <StatCard
          title="Task Completion"
          value={`${data.task_stats.completion_rate}%`}
          subtitle={`${data.task_stats.completed}/${data.task_stats.total} tasks`}
          icon={CheckSquare}
        />
        <StatCard
          title="Budget Variance"
          value={budgetVariancePct > 0 ? `${budgetVariancePct}% under` : budgetVariancePct < 0 ? `${Math.abs(budgetVariancePct)}% over` : 'On budget'}
          subtitle={`${formatCurrency(data.budget_summary.total_actual)} of ${formatCurrency(data.budget_summary.total_estimated)}`}
          icon={DollarSign}
        />
        <StatCard
          title="Avg NPS"
          value={data.client_satisfaction.avg_nps ? data.client_satisfaction.avg_nps.toFixed(1) : 'N/A'}
          subtitle={`${data.client_satisfaction.total_responses} responses`}
          icon={Star}
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-text-secondary">Overdue Tasks</span>
          </div>
          <p className="text-2xl font-semibold text-text-primary">{data.task_stats.overdue}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary-500" />
            <span className="text-sm text-text-secondary">Active Resources</span>
          </div>
          <p className="text-2xl font-semibold text-text-primary">{data.resource_utilization.active_users}</p>
          <p className="text-xs text-text-tertiary">{data.resource_utilization.avg_hours_per_user}h avg/user</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-text-secondary">Vendor Avg Rating</span>
          </div>
          <p className="text-2xl font-semibold text-text-primary">
            {data.vendor_performance.avg_overall ? data.vendor_performance.avg_overall.toFixed(1) : 'N/A'}
            <span className="text-sm text-text-tertiary font-normal">/5</span>
          </p>
          <p className="text-xs text-text-tertiary">{data.vendor_performance.total_ratings} ratings</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-primary-500" />
            <span className="text-sm text-text-secondary">Total Hours Logged</span>
          </div>
          <p className="text-2xl font-semibold text-text-primary">{data.resource_utilization.total_hours.toLocaleString()}h</p>
        </div>
      </div>

      {/* Event list table */}
      <div className="bg-surface rounded-xl border border-border">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">All Events</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-medium text-text-tertiary uppercase">Event</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-text-tertiary uppercase">Status</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-text-tertiary uppercase">Health</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-text-tertiary uppercase">Dates</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-text-tertiary uppercase">Budget Est.</th>
                <th className="text-right px-3 py-3 text-xs font-medium text-text-tertiary uppercase">Budget Act.</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-text-tertiary uppercase">Completion</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map((event) => (
                <tr key={event.id} className="border-b border-border/50 hover:bg-surface-secondary transition-colors">
                  <td className="px-5 py-3 font-medium text-text-primary">{event.title}</td>
                  <td className="px-3 py-3"><StatusBadge type="event" value={event.status} /></td>
                  <td className="px-3 py-3"><HealthBadge score={event.health_score} /></td>
                  <td className="px-3 py-3 text-text-secondary whitespace-nowrap">
                    {event.start_date ? formatDate(event.start_date) : '—'}
                  </td>
                  <td className="px-3 py-3 text-right text-text-secondary">{formatCurrency(event.budget_estimated)}</td>
                  <td className="px-3 py-3 text-right text-text-secondary">{formatCurrency(event.budget_actual)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-16">
                        <ProgressBar value={event.completion_percentage ?? 0} max={100} />
                      </div>
                      <span className="text-xs text-text-secondary w-8 text-right">{event.completion_percentage ?? 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {data.events.length === 0 && (
                <tr><td colSpan={7}><EmptyState message="No events found" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Event Tab ───────────────────────────────────────────────

function EventTab({ eventOptions }: { eventOptions: EventOption[] }) {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [data, setData] = useState<EventReportData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedEventId) return
    setLoading(true)
    fetch(`/api/reports/event/${selectedEventId}`)
      .then((r) => r.json())
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedEventId])

  return (
    <div className="space-y-6">
      {/* Event selector */}
      <div className="relative max-w-md">
        <select
          value={selectedEventId ?? ''}
          onChange={(e) => setSelectedEventId(e.target.value ? Number(e.target.value) : null)}
          className="w-full appearance-none bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        >
          <option value="">Select an event...</option>
          {eventOptions.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-text-tertiary pointer-events-none" />
      </div>

      {!selectedEventId && <EmptyState message="Select an event to view its detailed report" />}
      {loading && <LoadingSpinner />}

      {data && !loading && (
        <>
          {/* Event header */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">{data.event.title}</h2>
                <p className="text-sm text-text-secondary mt-1">
                  {data.event.start_date ? formatDate(data.event.start_date) : '—'}
                  {' — '}
                  {data.event.end_date ? formatDate(data.event.end_date) : '—'}
                  {data.event.venue_name && ` | ${data.event.venue_name}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <HealthBadge score={data.event.health_score} />
                <StatusBadge type="event" value={data.event.status} />
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Task Completion"
              value={`${data.task_completion.percentage}%`}
              subtitle={`${data.task_completion.completed}/${data.task_completion.total} tasks`}
              icon={CheckSquare}
            />
            <StatCard
              title="Budget Variance"
              value={formatCurrency(data.budget.variance)}
              subtitle={`${formatCurrency(data.budget.actual)} of ${formatCurrency(data.budget.estimated)}`}
              icon={DollarSign}
            />
            <StatCard
              title="Hours Logged"
              value={`${data.team_utilization.total_hours}h`}
              subtitle={`${data.team_utilization.members.length} team members`}
              icon={Clock}
            />
            <StatCard
              title="NPS Score"
              value={data.feedback.avg_nps ? data.feedback.avg_nps.toFixed(1) : 'N/A'}
              subtitle={`${data.feedback.response_count} responses`}
              icon={Star}
            />
          </div>

          {/* Detail grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendee stats */}
            <div className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-text-tertiary" />
                <h3 className="text-sm font-semibold text-text-primary">Attendee Stats</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-tertiary">Registered</p>
                  <p className="text-xl font-semibold text-text-primary">{data.attendee_stats.registered}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Checked In</p>
                  <p className="text-xl font-semibold text-green-600">{data.attendee_stats.checked_in}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Cancelled</p>
                  <p className="text-xl font-semibold text-red-500">{data.attendee_stats.cancelled}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">No Show</p>
                  <p className="text-xl font-semibold text-amber-500">{data.attendee_stats.no_show}</p>
                </div>
              </div>
              {data.attendee_stats.total > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-text-secondary">Check-in Rate</span>
                    <span className="font-medium text-text-primary">
                      {Math.round((data.attendee_stats.checked_in / data.attendee_stats.total) * 100)}%
                    </span>
                  </div>
                  <ProgressBar value={data.attendee_stats.checked_in} max={data.attendee_stats.total} color="bg-green-500" />
                </div>
              )}
            </div>

            {/* Vendor status */}
            <div className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-text-tertiary" />
                <h3 className="text-sm font-semibold text-text-primary">Vendor Status</h3>
              </div>
              {data.vendor_summary.length === 0 ? (
                <EmptyState message="No vendors assigned" />
              ) : (
                <div className="space-y-3">
                  {data.vendor_summary.map((v) => (
                    <div key={v.status} className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary capitalize">{v.status.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-semibold text-text-primary">{v.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team utilization */}
            <div className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-text-tertiary" />
                <h3 className="text-sm font-semibold text-text-primary">Team Hours</h3>
              </div>
              {data.team_utilization.members.length === 0 ? (
                <EmptyState message="No hours logged yet" />
              ) : (
                <div className="space-y-3">
                  {data.team_utilization.members.map((m) => {
                    const maxHours = Math.max(...data.team_utilization.members.map((x) => x.hours), 1)
                    return (
                      <div key={m.user_id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-text-primary">{m.name}</span>
                          <span className="text-xs font-medium text-text-secondary">{m.hours}h</span>
                        </div>
                        <ProgressBar value={m.hours} max={maxHours} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Risks & Lessons */}
            <div className="bg-surface rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Risks & Lessons Learned</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-surface-secondary">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-semibold text-text-primary">{data.risk_count}</p>
                  <p className="text-xs text-text-tertiary">Risk Assessments</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-surface-secondary">
                  <CheckSquare className="h-5 w-5 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-semibold text-text-primary">{data.lessons_learned_count}</p>
                  <p className="text-xs text-text-tertiary">Lessons Learned</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Utilization Tab ─────────────────────────────────────────

function UtilizationTab() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [data, setData] = useState<UtilizationData | null>(null)
  const [loading, setLoading] = useState(false)

  function fetchData() {
    setLoading(true)
    const params = new URLSearchParams()
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    fetch(`/api/reports/utilization?${params}`)
      .then((r) => r.json())
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const maxHours = data ? Math.max(...data.users.map((u) => u.total_hours), 1) : 1

  return (
    <div className="space-y-6">
      {/* Date range picker */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>
        <button
          onClick={fetchData}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          Apply
        </button>
      </div>

      {loading && <LoadingSpinner />}

      {data && !loading && (
        <>
          {/* Over-allocated warning */}
          {data.over_allocated.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-800">
                  Over-Allocated Users ({'>'}40h/week)
                </h3>
              </div>
              <div className="space-y-1">
                {data.over_allocated.map((u) => (
                  <p key={u.user_id} className="text-sm text-amber-700">
                    {u.name} — {u.avg_weekly_hours}h/week avg ({u.total_hours}h total)
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* User utilization table */}
          <div className="bg-surface rounded-xl border border-border">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-text-primary">User Utilization</h3>
              {data.date_range.from && data.date_range.to && (
                <p className="text-xs text-text-tertiary mt-0.5">
                  {formatDate(data.date_range.from)} — {formatDate(data.date_range.to)} ({data.date_range.weeks} weeks)
                </p>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-medium text-text-tertiary uppercase">User</th>
                    <th className="text-right px-3 py-3 text-xs font-medium text-text-tertiary uppercase">Total Hours</th>
                    <th className="text-right px-3 py-3 text-xs font-medium text-text-tertiary uppercase">Billable</th>
                    <th className="text-right px-3 py-3 text-xs font-medium text-text-tertiary uppercase">Avg/Week</th>
                    <th className="text-right px-3 py-3 text-xs font-medium text-text-tertiary uppercase">Entries</th>
                    <th className="px-5 py-3 text-xs font-medium text-text-tertiary uppercase w-40">Load</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => {
                    const isOver = u.avg_weekly_hours > 40
                    return (
                      <tr key={u.user_id} className={`border-b border-border/50 ${isOver ? 'bg-amber-50/50' : 'hover:bg-surface-secondary'} transition-colors`}>
                        <td className="px-5 py-3 font-medium text-text-primary">{u.name}</td>
                        <td className="px-3 py-3 text-right text-text-secondary">{u.total_hours}h</td>
                        <td className="px-3 py-3 text-right text-text-secondary">{u.billable_hours}h</td>
                        <td className={`px-3 py-3 text-right font-medium ${isOver ? 'text-amber-600' : 'text-text-primary'}`}>
                          {u.avg_weekly_hours}h
                        </td>
                        <td className="px-3 py-3 text-right text-text-secondary">{u.entry_count}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <ProgressBar
                                value={u.total_hours}
                                max={maxHours}
                                color={isOver ? 'bg-amber-500' : 'bg-primary-500'}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {data.users.length === 0 && (
                    <tr><td colSpan={6}><EmptyState message="No timesheet data for this period" /></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* By-event allocation */}
          {data.by_event.length > 0 && (
            <div className="bg-surface rounded-xl border border-border">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary">Hours by Event</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 text-xs font-medium text-text-tertiary uppercase">User</th>
                      <th className="text-left px-3 py-3 text-xs font-medium text-text-tertiary uppercase">Event</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-text-tertiary uppercase">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_event.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-surface-secondary transition-colors">
                        <td className="px-5 py-3 text-text-primary">{row.name}</td>
                        <td className="px-3 py-3 text-text-secondary">{row.event_title}</td>
                        <td className="px-5 py-3 text-right font-medium text-text-primary">{row.hours}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
