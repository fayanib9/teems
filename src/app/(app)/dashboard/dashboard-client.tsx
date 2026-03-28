'use client'

import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { useState, useEffect } from 'react'
import { CalendarDays, CheckSquare, ClipboardCheck, Clock, Plus, ListTodo, Sparkles, Calculator, ArrowRight, Rocket, Users, X, CheckCircle, Circle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

type EventItem = {
  id: number
  title: string
  status: string
  start_date: string | null
  venue_name: string | null
}

type TaskItem = {
  id: number
  title: string
  status: string
  priority: string
  due_date: string | null
  event_id: number
}

type Props = {
  user: { first_name: string }
  isExecutive: boolean
  stats: {
    activeEvents: number
    myTasks: number
    dueSoon: number
    pendingApprovals: number
    totalEvents: number
  }
  recentEvents: EventItem[]
  myTasksList: TaskItem[]
  upcomingDeadlines: TaskItem[]
  onboarding: {
    hasClients: boolean
    hasEvents: boolean
    hasPlans: boolean
    hasTeamAssignments: boolean
  }
}

function ClickableStatCard({ title, value, subtitle, icon: Icon, href, color }: {
  title: string; value: number; subtitle?: string; icon: React.ElementType; href: string; color?: string
}) {
  return (
    <Link href={href} className="block">
      <div className="bg-surface rounded-xl border border-border p-5 hover:border-primary-300 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-text-secondary">{title}</p>
            <p className="text-2xl font-semibold text-text-primary">{value}</p>
            {subtitle && <p className="text-xs text-text-tertiary">{subtitle}</p>}
          </div>
          <div className="rounded-lg bg-primary-50 p-2.5">
            <Icon className="h-5 w-5 text-primary-500" />
          </div>
        </div>
      </div>
    </Link>
  )
}

export function DashboardClient({ user, isExecutive, stats, recentEvents, myTasksList, upcomingDeadlines, onboarding }: Props) {
  const hasEvents = stats.totalEvents > 0

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.first_name}`}
        description={isExecutive ? 'Executive overview of all operations' : 'Here\'s what needs your attention today'}
      />

      {/* Onboarding - show when not all steps complete */}
      {!onboarding.hasEvents && <GettingStartedInline onboarding={onboarding} />}

      {/* Stat Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <ClickableStatCard
          title="Active Events"
          value={stats.activeEvents}
          icon={CalendarDays}
          href="/events"
        />
        <ClickableStatCard
          title="My Tasks"
          value={stats.myTasks}
          icon={CheckSquare}
          href="/tasks"
        />
        <ClickableStatCard
          title="Due Soon"
          value={stats.dueSoon}
          icon={Clock}
          href="/tasks"
        />
        <ClickableStatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={ClipboardCheck}
          href="/approvals"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/events/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Event
          </Link>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface border border-border text-text-primary rounded-lg text-sm font-medium hover:bg-surface-secondary transition-colors"
          >
            <ListTodo className="h-4 w-4" /> New Task
          </Link>
          <Link
            href="/tools/planner/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface border border-border text-text-primary rounded-lg text-sm font-medium hover:bg-surface-secondary transition-colors"
          >
            <Sparkles className="h-4 w-4" /> Plan Generator
          </Link>
          <Link
            href="/tools/budget/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface border border-border text-text-primary rounded-lg text-sm font-medium hover:bg-surface-secondary transition-colors"
          >
            <Calculator className="h-4 w-4" /> Budget Calculator
          </Link>
        </div>
      </div>

      {/* Getting Started Onboarding */}
      {!hasEvents && (
        <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-xl border border-primary-200 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary-500 p-3">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-1">Get started with TEEMS</h2>
              <p className="text-sm text-text-secondary mb-4">Create your first event to start managing your exhibitions and events.</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/events/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Create First Event
                </Link>
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-text-primary rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors border border-border"
                >
                  Explore Tools <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Events */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">Recent Events</h2>
            <Link href="/events" className="text-xs text-primary-500 hover:text-primary-600">View all</Link>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-text-secondary py-4">No events yet. Create your first event to get started.</p>
          ) : (
            <div className="space-y-2">
              {recentEvents.map(event => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-secondary transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">{event.title}</p>
                    <p className="text-xs text-text-tertiary">
                      {event.start_date ? formatDate(event.start_date) : '--'}
                      {event.venue_name && ` \u00b7 ${event.venue_name}`}
                    </p>
                  </div>
                  <StatusBadge type="event" value={event.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My Tasks */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">My Tasks</h2>
            <Link href="/tasks" className="text-xs text-primary-500 hover:text-primary-600">View all</Link>
          </div>
          {myTasksList.length === 0 ? (
            <p className="text-sm text-text-secondary py-4">No tasks due this week.</p>
          ) : (
            <div className="space-y-2">
              {myTasksList.map(task => (
                <Link
                  key={task.id}
                  href={`/events/${task.event_id}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-secondary transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">{task.title}</p>
                    <p className="text-xs text-text-tertiary">
                      Due {task.due_date ? formatDate(task.due_date) : '--'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge type="priority" value={task.priority} />
                    <StatusBadge type="task" value={task.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-text-tertiary" />
            <h2 className="text-base font-semibold text-text-primary">Upcoming Deadlines</h2>
          </div>
          <span className="text-xs text-text-tertiary">Next 7 days</span>
        </div>
        {upcomingDeadlines.length === 0 ? (
          <p className="text-sm text-text-secondary py-4">No upcoming deadlines in the next 7 days.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingDeadlines.map(task => {
              const dueDate = task.due_date ? new Date(task.due_date) : null
              const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
              const urgencyColor = daysLeft !== null && daysLeft <= 1 ? 'text-red-600' : daysLeft !== null && daysLeft <= 3 ? 'text-amber-600' : 'text-text-tertiary'

              return (
                <Link
                  key={task.id}
                  href={`/events/${task.event_id}`}
                  className="flex flex-col p-3 rounded-lg border border-border-light hover:bg-surface-secondary transition-colors"
                >
                  <p className="text-sm font-medium text-text-primary truncate mb-1">{task.title}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${urgencyColor}`}>
                      {daysLeft !== null ? (daysLeft <= 0 ? 'Due today' : `${daysLeft}d left`) : '--'}
                    </span>
                    <StatusBadge type="priority" value={task.priority} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Inline Getting Started ─────────────────────────────────

const DISMISSED_KEY = 'teems_onboarding_dismissed'

function GettingStartedInline({ onboarding }: { onboarding: Props['onboarding'] }) {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(DISMISSED_KEY)
    setDismissed(stored === 'true')
  }, [])

  if (dismissed) return null

  const steps = [
    { label: 'Create your first client', href: '/clients', completed: onboarding.hasClients },
    { label: 'Create an event', href: '/events/new', completed: onboarding.hasEvents },
    { label: 'Run the Plan Generator', href: '/tools/planner/new', completed: onboarding.hasPlans },
    { label: 'Assign your team', href: onboarding.hasEvents ? '/events' : '/teams', completed: onboarding.hasTeamAssignments },
  ]

  const completedCount = steps.filter(s => s.completed).length
  const pct = Math.round((completedCount / steps.length) * 100)

  return (
    <div className="bg-surface rounded-xl border border-primary-200 p-5 mb-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
            <Rocket className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">Getting Started with TEEMS</h3>
            <p className="text-sm text-text-secondary">{completedCount}/{steps.length} steps complete</p>
          </div>
        </div>
        <button onClick={() => { localStorage.setItem(DISMISSED_KEY, 'true'); setDismissed(true) }} className="p-1 text-text-tertiary hover:text-text-primary cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
        <div className="h-1.5 rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="space-y-1.5">
        {steps.map((step, i) => (
          <Link key={i} href={step.href} className={`flex items-center gap-2.5 p-2 rounded-lg text-sm transition-colors ${step.completed ? 'text-green-600' : 'text-text-primary hover:bg-surface-secondary'}`}>
            {step.completed ? <CheckCircle className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 text-text-tertiary shrink-0" />}
            <span className={step.completed ? 'line-through' : ''}>{step.label}</span>
            {!step.completed && <ChevronRight className="h-3.5 w-3.5 text-text-tertiary ml-auto" />}
          </Link>
        ))}
      </div>
    </div>
  )
}
