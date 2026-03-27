'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { formatDate, formatDateTime, formatCurrency, getInitials } from '@/lib/utils'
import {
  ArrowLeft, Edit, Trash2, CalendarDays, MapPin, Users, DollarSign,
  CheckSquare, Truck, Mic, Presentation, FileText, Milestone, Clock,
  MoreHorizontal, ExternalLink, Plus, AlertTriangle, PlayCircle,
} from 'lucide-react'
import Link from 'next/link'

type EventData = {
  id: number
  title: string
  slug: string
  description: string | null
  status: string
  priority: string | null
  start_date: Date | null
  end_date: Date | null
  timezone: string | null
  venue_name: string | null
  venue_address: string | null
  venue_city: string | null
  venue_country: string | null
  expected_attendees: number | null
  actual_attendees: number | null
  budget_estimated: number | null
  budget_actual: number | null
  currency: string | null
  notes: string | null
  cover_image_path: string | null
  event_type_id: number | null
  client_id: number | null
  created_by: number | null
  created_at: Date | null
  updated_at: Date | null
  event_type_name: string | null
  event_type_color: string | null
  event_type_icon: string | null
  client_name: string | null
}

type Props = {
  event: EventData
  counts: {
    tasks: number
    tasksDone: number
    vendors: number
    speakers: number
    exhibitors: number
    documents: number
    milestones: number
  }
  recentTasks: {
    id: number
    title: string
    status: string | null
    priority: string | null
    due_date: Date | null
    assigned_to: number | null
    assigned_name: string | null
  }[]
  teamMembers: {
    id: number
    user_id: number
    role_in_event: string | null
    first_name: string
    last_name: string
    email: string
  }[]
  canEdit: boolean
  canDelete: boolean
}

type Tab = 'overview' | 'tasks' | 'timeline' | 'team' | 'vendors' | 'speakers' | 'exhibitors' | 'documents' | 'sessions' | 'booths' | 'budget' | 'event_day'

const TABS: { key: Tab; label: string; icon: typeof CalendarDays }[] = [
  { key: 'overview', label: 'Overview', icon: CalendarDays },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'timeline', label: 'Timeline', icon: Milestone },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'vendors', label: 'Vendors', icon: Truck },
  { key: 'speakers', label: 'Speakers', icon: Mic },
  { key: 'exhibitors', label: 'Exhibitors', icon: Presentation },
  { key: 'sessions', label: 'Agenda', icon: Clock },
  { key: 'booths', label: 'Booths', icon: MapPin },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'budget', label: 'Budget', icon: DollarSign },
  { key: 'event_day', label: 'Event Day', icon: PlayCircle },
]

export function EventCommandCenter({ event, counts, recentTasks, teamMembers, canEdit, canDelete }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const daysUntil = event.start_date
    ? Math.ceil((new Date(event.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast({ type: 'success', message: 'Event deleted' })
      router.push('/events')
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to delete event' })
    } finally {
      setDeleting(false)
      setDeleteModal(false)
    }
  }

  async function handleStatusChange(status: string) {
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      toast({ type: 'success', message: `Status updated to ${status}` })
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to update status' })
    }
  }

  const taskProgress = counts.tasks > 0 ? Math.round((counts.tasksDone / counts.tasks) * 100) : 0

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <Link href="/events">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {event.event_type_name && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${event.event_type_color}15`,
                    color: event.event_type_color || '#312C6A',
                  }}
                >
                  {event.event_type_name}
                </span>
              )}
              <StatusBadge type="event" value={event.status} />
              {event.priority && event.priority !== 'medium' && (
                <StatusBadge type="priority" value={event.priority} />
              )}
            </div>
            <h1 className="text-xl font-semibold text-text-primary">{event.title}</h1>
            {event.client_name && (
              <p className="text-sm text-text-secondary mt-0.5">{event.client_name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link href={`/events/${event.id}/edit`}>
              <Button variant="outline" size="sm"><Edit className="h-3.5 w-3.5" /> Edit</Button>
            </Link>
          )}
          {canDelete && (
            <Button variant="ghost" size="icon" onClick={() => setDeleteModal(true)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick info bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-text-secondary">
        {event.start_date && (
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {formatDate(event.start_date)}
            {event.end_date && ` — ${formatDate(event.end_date)}`}
          </span>
        )}
        {event.venue_name && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {event.venue_name}{event.venue_city ? `, ${event.venue_city}` : ''}
          </span>
        )}
        {daysUntil !== null && daysUntil > 0 && (
          <Badge color={daysUntil <= 7 ? 'red' : daysUntil <= 30 ? 'amber' : 'blue'}>
            {daysUntil} day{daysUntil !== 1 ? 's' : ''} away
          </Badge>
        )}
        {daysUntil !== null && daysUntil <= 0 && daysUntil >= -1 && (
          <Badge color="green">Today</Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6 -mx-1 overflow-x-auto">
        <nav className="flex gap-0 px-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {key === 'tasks' && counts.tasks > 0 && (
                <span className="text-xs bg-surface-tertiary rounded-full px-1.5 py-0.5">{counts.tasks}</span>
              )}
              {key === 'vendors' && counts.vendors > 0 && (
                <span className="text-xs bg-surface-tertiary rounded-full px-1.5 py-0.5">{counts.vendors}</span>
              )}
              {key === 'speakers' && counts.speakers > 0 && (
                <span className="text-xs bg-surface-tertiary rounded-full px-1.5 py-0.5">{counts.speakers}</span>
              )}
              {key === 'documents' && counts.documents > 0 && (
                <span className="text-xs bg-surface-tertiary rounded-full px-1.5 py-0.5">{counts.documents}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          event={event}
          counts={counts}
          taskProgress={taskProgress}
          recentTasks={recentTasks}
          teamMembers={teamMembers}
          canEdit={canEdit}
          onStatusChange={handleStatusChange}
        />
      )}
      {activeTab === 'tasks' && (
        <EventTasksTab
          eventId={event.id}
          recentTasks={recentTasks}
          taskCount={counts.tasks}
        />
      )}
      {activeTab === 'timeline' && <TimelineTab eventId={event.id} />}
      {activeTab === 'team' && <TeamTab teamMembers={teamMembers} />}
      {activeTab === 'vendors' && <EntityAssignTab eventId={event.id} type="vendors" />}
      {activeTab === 'speakers' && <EntityAssignTab eventId={event.id} type="speakers" />}
      {activeTab === 'exhibitors' && <EntityAssignTab eventId={event.id} type="exhibitors" />}
      {activeTab === 'sessions' && <SessionsTab eventId={event.id} />}
      {activeTab === 'booths' && <BoothsTab eventId={event.id} />}
      {activeTab === 'documents' && <EventDocumentsTab eventId={event.id} />}
      {activeTab === 'budget' && <BudgetTab event={event} />}
      {activeTab === 'event_day' && <EventDayTab eventId={event.id} />}

      {/* Delete Modal */}
      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Event" size="sm">
        <p className="text-sm text-text-secondary mb-4">
          Are you sure you want to delete <strong>{event.title}</strong>? This will permanently remove all associated tasks, documents, and assignments.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete Event</Button>
        </div>
      </Modal>
    </>
  )
}

function OverviewTab({
  event, counts, taskProgress, recentTasks, teamMembers, canEdit, onStatusChange,
}: {
  event: EventData
  counts: Props['counts']
  taskProgress: number
  recentTasks: Props['recentTasks']
  teamMembers: Props['teamMembers']
  canEdit: boolean
  onStatusChange: (status: string) => void
}) {
  // Status workflow
  const statusFlow: Record<string, string[]> = {
    draft: ['planning'],
    planning: ['confirmed', 'cancelled'],
    confirmed: ['in_progress', 'postponed', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    postponed: ['planning', 'cancelled'],
  }
  const nextStatuses = statusFlow[event.status] || []

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Tasks" value={`${counts.tasksDone}/${counts.tasks}`} subtitle={`${taskProgress}% complete`} icon={CheckSquare} />
        <StatCard title="Team" value={teamMembers.length} icon={Users} />
        <StatCard title="Vendors" value={counts.vendors} icon={Truck} />
        <StatCard title="Documents" value={counts.documents} icon={FileText} />
      </div>

      {/* Status Actions */}
      {canEdit && nextStatuses.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-primary mb-2">Move to next stage</h3>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map(s => (
              <Button key={s} variant="outline" size="sm" onClick={() => onStatusChange(s)}>
                Move to {s.replace(/_/g, ' ')}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Details */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Event Details</h3>
          <dl className="space-y-2.5 text-sm">
            {event.description && (
              <div>
                <dt className="text-text-tertiary">Description</dt>
                <dd className="text-text-primary mt-0.5">{event.description}</dd>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-text-tertiary">Start</dt>
                <dd className="text-text-primary">{formatDateTime(event.start_date)}</dd>
              </div>
              <div>
                <dt className="text-text-tertiary">End</dt>
                <dd className="text-text-primary">{formatDateTime(event.end_date)}</dd>
              </div>
            </div>
            {event.venue_name && (
              <div>
                <dt className="text-text-tertiary">Venue</dt>
                <dd className="text-text-primary">
                  {event.venue_name}
                  {event.venue_address && <span className="block text-text-secondary text-xs">{event.venue_address}</span>}
                  {(event.venue_city || event.venue_country) && (
                    <span className="block text-text-secondary text-xs">
                      {[event.venue_city, event.venue_country].filter(Boolean).join(', ')}
                    </span>
                  )}
                </dd>
              </div>
            )}
            {event.expected_attendees && (
              <div>
                <dt className="text-text-tertiary">Expected Attendees</dt>
                <dd className="text-text-primary">{event.expected_attendees.toLocaleString()}</dd>
              </div>
            )}
            {event.notes && (
              <div>
                <dt className="text-text-tertiary">Notes</dt>
                <dd className="text-text-secondary whitespace-pre-line">{event.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Recent Tasks */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Recent Tasks</h3>
            {counts.tasks > 0 && (
              <button onClick={() => {}} className="text-xs text-primary-500 hover:text-primary-600 font-medium cursor-pointer">
                View all
              </button>
            )}
          </div>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-text-tertiary py-4 text-center">No tasks yet</p>
          ) : (
            <div className="space-y-2">
              {recentTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between py-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.due_date && (
                        <span className="text-xs text-text-tertiary flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(task.due_date)}
                        </span>
                      )}
                      {task.assigned_name && (
                        <span className="text-xs text-text-tertiary">{task.assigned_name}</span>
                      )}
                    </div>
                  </div>
                  <StatusBadge type="task" value={task.status || 'todo'} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Progress Bar */}
      {counts.tasks > 0 && (
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-text-primary">Task Progress</h3>
            <span className="text-sm text-text-secondary">{taskProgress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-primary-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${taskProgress}%` }}
            />
          </div>
          <p className="text-xs text-text-tertiary mt-1.5">
            {counts.tasksDone} of {counts.tasks} tasks completed
          </p>
        </div>
      )}
    </div>
  )
}

function TeamTab({ teamMembers }: { teamMembers: Props['teamMembers'] }) {
  if (teamMembers.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
        <h3 className="text-base font-medium text-text-primary mb-1">No team members assigned</h3>
        <p className="text-sm text-text-secondary">Assign team members to this event to manage responsibilities.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {teamMembers.map(member => (
        <div key={member.id} className="bg-surface rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-medium">
            {getInitials(member.first_name, member.last_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {member.first_name} {member.last_name}
            </p>
            <p className="text-xs text-text-tertiary capitalize">{member.role_in_event || 'Member'}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function BudgetTab({ event }: { event: EventData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-sm text-text-tertiary mb-1">Estimated Budget</h3>
          <p className="text-2xl font-semibold text-text-primary">
            {event.budget_estimated ? formatCurrency(event.budget_estimated) : '—'}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-sm text-text-tertiary mb-1">Actual Spend</h3>
          <p className="text-2xl font-semibold text-text-primary">
            {event.budget_actual ? formatCurrency(event.budget_actual) : '—'}
          </p>
          {event.budget_estimated && event.budget_actual && (
            <p className={`text-xs mt-1 ${event.budget_actual > event.budget_estimated ? 'text-red-500' : 'text-green-500'}`}>
              {event.budget_actual > event.budget_estimated ? 'Over' : 'Under'} budget by {formatCurrency(Math.abs(event.budget_actual - event.budget_estimated))}
            </p>
          )}
        </div>
      </div>
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Budget Breakdown</h3>
        <p className="text-sm text-text-tertiary text-center py-8">
          Detailed budget tracking with vendor costs will be available when vendor management is built.
        </p>
      </div>
    </div>
  )
}

function EventTasksTab({ eventId, recentTasks, taskCount }: { eventId: number; recentTasks: Props['recentTasks']; taskCount: number }) {
  const router = useRouter()
  const { toast } = useToast()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickLoading, setQuickLoading] = useState(false)

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!quickTitle.trim()) return
    setQuickLoading(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, title: quickTitle.trim() }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ type: 'success', message: 'Task added' })
      setQuickTitle('')
      setShowQuickAdd(false)
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to add task' })
    } finally {
      setQuickLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{taskCount} task{taskCount !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowQuickAdd(!showQuickAdd)}>
            <Plus className="h-3.5 w-3.5" /> Quick Add
          </Button>
          <Link href={`/tasks?event_id=${eventId}`}>
            <Button variant="ghost" size="sm">View Board <ExternalLink className="h-3.5 w-3.5" /></Button>
          </Link>
        </div>
      </div>

      {showQuickAdd && (
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Task title..."
            autoFocus
            className="flex-1 h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <Button type="submit" size="sm" loading={quickLoading}>Add</Button>
        </form>
      )}

      {recentTasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckSquare className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary">No tasks yet. Add tasks to track work for this event.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {recentTasks.map(task => (
            <div key={task.id} className="flex items-center justify-between bg-surface rounded-lg border border-border p-3 hover:border-primary-200 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {task.due_date && (
                    <span className="text-xs text-text-tertiary flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDate(task.due_date)}
                    </span>
                  )}
                  {task.assigned_name && (
                    <span className="text-xs text-text-tertiary">{task.assigned_name}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {task.priority && task.priority !== 'medium' && (
                  <StatusBadge type="priority" value={task.priority} />
                )}
                <StatusBadge type="task" value={task.status || 'todo'} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Timeline Tab ────────────────────────────────────────────

type MilestoneData = {
  id: number
  title: string
  description: string | null
  due_date: string
  status: string | null
  sort_order: number | null
}

function TimelineTab({ eventId }: { eventId: number }) {
  const { toast } = useToast()
  const [milestones, setMilestones] = useState<MilestoneData[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msTitle, setMsTitle] = useState('')
  const [msDesc, setMsDesc] = useState('')
  const [msDue, setMsDue] = useState('')

  useState(() => {
    fetch(`/api/milestones?event_id=${eventId}`)
      .then(r => r.json())
      .then(data => { setMilestones(data.data || []); setLoaded(true) })
  })

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault()
    if (!msTitle.trim() || !msDue) return
    setSaving(true)
    try {
      const res = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, title: msTitle.trim(), description: msDesc || null, due_date: msDue }),
      })
      if (!res.ok) throw new Error('Failed')
      const { data } = await res.json()
      setMilestones(prev => [...prev, data].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()))
      setMsTitle(''); setMsDesc(''); setMsDue('')
      setShowAdd(false)
      toast({ type: 'success', message: 'Milestone added' })
    } catch {
      toast({ type: 'error', message: 'Failed to add milestone' })
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return <div className="text-center py-12"><p className="text-sm text-text-tertiary">Loading...</p></div>

  const today = new Date()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{milestones.length} milestone{milestones.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-3.5 w-3.5" /> Add Milestone</Button>
      </div>

      {showAdd && (
        <form onSubmit={addMilestone} className="bg-surface rounded-xl border border-border p-4 space-y-3">
          <input type="text" value={msTitle} onChange={e => setMsTitle(e.target.value)} placeholder="Milestone title..."
            autoFocus className="w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          <textarea value={msDesc} onChange={e => setMsDesc(e.target.value)} placeholder="Description (optional)..." rows={2}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          <input type="date" value={msDue} onChange={e => setMsDue(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" type="submit" loading={saving}>Add</Button>
          </div>
        </form>
      )}

      {milestones.length === 0 && !showAdd ? (
        <div className="text-center py-12">
          <Milestone className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary">No milestones yet. Add milestones to track key dates.</p>
        </div>
      ) : (
        <div className="relative pl-6">
          {/* Timeline line */}
          <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-border" />
          <div className="space-y-4">
            {milestones.map(ms => {
              const due = new Date(ms.due_date)
              const isPast = due < today && ms.status !== 'completed'
              const isComplete = ms.status === 'completed'
              return (
                <div key={ms.id} className="relative">
                  <div className={`absolute -left-3.5 w-3 h-3 rounded-full border-2 ${
                    isComplete ? 'bg-green-500 border-green-500' :
                    isPast ? 'bg-red-500 border-red-500' :
                    'bg-white border-primary-500'
                  }`} style={{ top: '4px' }} />
                  <div className={`bg-surface rounded-lg border p-3 ${
                    isComplete ? 'border-green-200' : isPast ? 'border-red-200' : 'border-border'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-medium ${isComplete ? 'text-green-700 line-through' : 'text-text-primary'}`}>{ms.title}</h4>
                      <span className={`text-xs font-medium ${isPast ? 'text-red-500' : isComplete ? 'text-green-500' : 'text-text-tertiary'}`}>
                        {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {ms.description && <p className="text-xs text-text-secondary mt-1">{ms.description}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Entity Assignment Tab (Vendors / Speakers / Exhibitors) ─

type EntityConfig = {
  apiPath: string
  nameField: string
  subtitleField: string
  extraFields: { key: string; label: string }[]
  allApiPath: string
  allIdField: string
  allNameField: string
}

const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  vendors: {
    apiPath: 'vendors',
    nameField: 'vendor_name',
    subtitleField: 'vendor_category',
    extraFields: [
      { key: 'service_description', label: 'Service' },
      { key: 'vendor_email', label: 'Email' },
      { key: 'vendor_phone', label: 'Phone' },
    ],
    allApiPath: '/api/vendors',
    allIdField: 'id',
    allNameField: 'name',
  },
  speakers: {
    apiPath: 'speakers',
    nameField: 'speaker_name',
    subtitleField: 'speaker_organization',
    extraFields: [
      { key: 'speaker_title', label: 'Title' },
      { key: 'role', label: 'Role' },
      { key: 'speaker_email', label: 'Email' },
    ],
    allApiPath: '/api/speakers',
    allIdField: 'id',
    allNameField: 'name',
  },
  exhibitors: {
    apiPath: 'exhibitors',
    nameField: 'exhibitor_name',
    subtitleField: 'exhibitor_industry',
    extraFields: [
      { key: 'package_type', label: 'Package' },
      { key: 'booth_number', label: 'Booth' },
      { key: 'exhibitor_email', label: 'Email' },
    ],
    allApiPath: '/api/exhibitors',
    allIdField: 'id',
    allNameField: 'name',
  },
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  invited: 'bg-blue-100 text-blue-700',
  declined: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
}

function EntityAssignTab({ eventId, type }: { eventId: number; type: string }) {
  const { toast } = useToast()
  const config = ENTITY_CONFIGS[type]
  const [items, setItems] = useState<Record<string, unknown>[]>([])
  const [allEntities, setAllEntities] = useState<{ id: number; name: string }[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [saving, setSaving] = useState(false)

  useState(() => {
    Promise.all([
      fetch(`/api/events/${eventId}/${config.apiPath}`).then(r => r.json()),
      fetch(config.allApiPath).then(r => r.json()),
    ]).then(([assigned, all]) => {
      setItems(Array.isArray(assigned) ? assigned : assigned.data || [])
      const allData = Array.isArray(all) ? all : all.data || []
      setAllEntities(allData.map((e: Record<string, unknown>) => ({ id: e[config.allIdField] as number, name: e[config.allNameField] as string })))
      setLoaded(true)
    })
  })

  const assignedIds = new Set(items.map(i => {
    const key = type === 'vendors' ? 'vendor_id' : type === 'speakers' ? 'speaker_id' : 'exhibitor_id'
    return i[key] as number
  }))
  const available = allEntities.filter(e => !assignedIds.has(e.id))

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId) return
    setSaving(true)
    const idField = type === 'vendors' ? 'vendor_id' : type === 'speakers' ? 'speaker_id' : 'exhibitor_id'
    try {
      const res = await fetch(`/api/events/${eventId}/${config.apiPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [idField]: Number(selectedId) }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ type: 'success', message: 'Assigned successfully' })
      setSelectedId('')
      setShowAdd(false)
      // Reload
      const data = await fetch(`/api/events/${eventId}/${config.apiPath}`).then(r => r.json())
      setItems(Array.isArray(data) ? data : data.data || [])
    } catch {
      toast({ type: 'error', message: 'Failed to assign' })
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(assignmentId: number) {
    try {
      await fetch(`/api/events/${eventId}/${config.apiPath}?assignment_id=${assignmentId}`, { method: 'DELETE' })
      setItems(prev => prev.filter(i => (i.id as number) !== assignmentId))
      toast({ type: 'success', message: 'Removed' })
    } catch {
      toast({ type: 'error', message: 'Failed to remove' })
    }
  }

  if (!loaded) return <div className="text-center py-12"><p className="text-sm text-text-tertiary">Loading...</p></div>

  const Icon = type === 'vendors' ? Truck : type === 'speakers' ? Mic : Presentation

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{items.length} assigned</p>
        <Button size="sm" onClick={() => setShowAdd(true)} disabled={available.length === 0}>
          <Plus className="h-3.5 w-3.5" /> Assign {type.slice(0, -1)}
        </Button>
      </div>

      {showAdd && available.length > 0 && (
        <form onSubmit={handleAssign} className="bg-surface rounded-xl border border-border p-4 flex gap-2">
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className="flex-1 h-9 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none">
            <option value="">Select {type.slice(0, -1)}...</option>
            {available.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <Button size="sm" type="submit" loading={saving}>Assign</Button>
          <Button variant="outline" size="sm" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
        </form>
      )}

      {items.length === 0 && !showAdd ? (
        <div className="text-center py-12">
          <Icon className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary">No {type} assigned to this event yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const name = item[config.nameField] as string
            const subtitle = item[config.subtitleField] as string | null
            const status = item.status as string | null
            return (
              <div key={item.id as number} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface hover:border-primary-200 transition-colors">
                <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {subtitle && <span className="text-xs text-text-tertiary">{subtitle}</span>}
                    {config.extraFields.slice(0, 1).map(f => {
                      const val = item[f.key] as string | null
                      return val ? <span key={f.key} className="text-xs text-text-tertiary">· {val}</span> : null
                    })}
                  </div>
                </div>
                {status && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`}>
                    {status}
                  </span>
                )}
                <button onClick={() => handleRemove(item.id as number)} className="text-red-400 hover:text-red-600 cursor-pointer p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Event Documents Tab ─────────────────────────────────────

type DocData = {
  id: number
  title: string
  file_name: string
  file_path: string
  file_size: number | null
  category: string | null
  created_at: string | null
}

function EventDocumentsTab({ eventId }: { eventId: number }) {
  const { toast } = useToast()
  const [docs, setDocs] = useState<DocData[]>([])
  const [loaded, setLoaded] = useState(false)

  useState(() => {
    fetch(`/api/documents?event_id=${eventId}`)
      .then(r => r.json())
      .then(data => { setDocs(data.data || data); setLoaded(true) })
  })

  if (!loaded) return <div className="text-center py-12"><p className="text-sm text-text-tertiary">Loading...</p></div>

  function formatSize(bytes: number | null) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
        <Link href={`/documents?event_id=${eventId}`}>
          <Button variant="outline" size="sm"><FileText className="h-3.5 w-3.5" /> Manage in Library</Button>
        </Link>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary">No documents linked to this event.</p>
          <Link href="/documents" className="text-xs text-primary-500 hover:text-primary-600 mt-1 inline-block">
            Go to Document Library →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface hover:border-primary-200 transition-colors">
              <div className="h-9 w-9 rounded bg-primary-50 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{doc.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-text-tertiary">{doc.file_name}</span>
                  {doc.file_size && <span className="text-xs text-text-tertiary">· {formatSize(doc.file_size)}</span>}
                  {doc.category && <span className="text-xs text-text-tertiary">· {doc.category}</span>}
                </div>
              </div>
              <a href={`/api/files/${doc.file_path}`} target="_blank" rel="noopener noreferrer"
                className="text-primary-500 hover:text-primary-600 p-1">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sessions / Agenda Tab ───────────────────────────────────

type SessionData = {
  id: number
  title: string
  description: string | null
  session_type: string | null
  date: string
  start_time: string
  end_time: string
  location: string | null
  capacity: number | null
  status: string | null
}

const SESSION_TYPES = ['keynote', 'panel', 'workshop', 'breakout', 'networking', 'other']

function SessionsTab({ eventId }: { eventId: number }) {
  const { toast } = useToast()
  const [sessionsList, setSessionsList] = useState<SessionData[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sTitle, setSTitle] = useState('')
  const [sType, setSType] = useState('')
  const [sDate, setSDate] = useState('')
  const [sStart, setSStart] = useState('')
  const [sEnd, setSEnd] = useState('')
  const [sLocation, setSLocation] = useState('')
  const [sCapacity, setSCapacity] = useState('')

  useState(() => {
    fetch(`/api/events/${eventId}/sessions`)
      .then(r => r.json())
      .then(data => { setSessionsList(Array.isArray(data) ? data : data.data || []); setLoaded(true) })
  })

  async function addSession(e: React.FormEvent) {
    e.preventDefault()
    if (!sTitle.trim() || !sDate || !sStart || !sEnd) return
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sTitle.trim(),
          session_type: sType || null,
          date: sDate,
          start_time: sStart,
          end_time: sEnd,
          location: sLocation || null,
          capacity: sCapacity ? Number(sCapacity) : null,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const newSession = await res.json()
      setSessionsList(prev => [...prev, newSession].sort((a, b) => {
        const d = new Date(a.date).getTime() - new Date(b.date).getTime()
        return d !== 0 ? d : a.start_time.localeCompare(b.start_time)
      }))
      setSTitle(''); setSType(''); setSDate(''); setSStart(''); setSEnd(''); setSLocation(''); setSCapacity('')
      setShowAdd(false)
      toast({ type: 'success', message: 'Session added' })
    } catch {
      toast({ type: 'error', message: 'Failed to add session' })
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return <div className="text-center py-12"><p className="text-sm text-text-tertiary">Loading...</p></div>

  // Group by date
  const byDate = sessionsList.reduce<Record<string, SessionData[]>>((acc, s) => {
    const d = new Date(s.date).toISOString().split('T')[0]
    if (!acc[d]) acc[d] = []
    acc[d].push(s)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">{sessionsList.length} session{sessionsList.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-3.5 w-3.5" /> Add Session</Button>
      </div>

      {showAdd && (
        <form onSubmit={addSession} className="bg-surface rounded-xl border border-border p-4 space-y-3">
          <input type="text" value={sTitle} onChange={e => setSTitle(e.target.value)} placeholder="Session title..."
            autoFocus className="w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select value={sType} onChange={e => setSType(e.target.value)}
              className="h-9 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none">
              <option value="">Type</option>
              {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="date" value={sDate} onChange={e => setSDate(e.target.value)}
              className="h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            <input type="time" value={sStart} onChange={e => setSStart(e.target.value)} placeholder="Start"
              className="h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            <input type="time" value={sEnd} onChange={e => setSEnd(e.target.value)} placeholder="End"
              className="h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={sLocation} onChange={e => setSLocation(e.target.value)} placeholder="Location"
              className="h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            <input type="number" value={sCapacity} onChange={e => setSCapacity(e.target.value)} placeholder="Capacity"
              className="h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" type="submit" loading={saving}>Add</Button>
          </div>
        </form>
      )}

      {sessionsList.length === 0 && !showAdd ? (
        <div className="text-center py-12">
          <Clock className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary">No sessions yet. Build your event agenda.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([dateStr, dateSessions]) => (
            <div key={dateStr}>
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                {new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <div className="space-y-2">
                {dateSessions.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface">
                    <div className="text-center shrink-0 w-16">
                      <p className="text-sm font-medium text-primary-600">{s.start_time}</p>
                      <p className="text-xs text-text-tertiary">{s.end_time}</p>
                    </div>
                    <div className="w-px h-8 bg-border shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{s.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {s.session_type && (
                          <span className="text-xs bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded capitalize">{s.session_type}</span>
                        )}
                        {s.location && <span className="text-xs text-text-tertiary flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.location}</span>}
                        {s.capacity && <span className="text-xs text-text-tertiary flex items-center gap-1"><Users className="h-3 w-3" /> {s.capacity}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Booths Tab ──────────────────────────────────────────────

type BoothData = {
  id: number
  booth_number: string
  size: string | null
  dimensions: string | null
  location_zone: string | null
  price: number | null
  amenities: string | null
  status: string | null
}

const BOOTH_STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  reserved: 'bg-amber-100 text-amber-700',
  assigned: 'bg-blue-100 text-blue-700',
  occupied: 'bg-purple-100 text-purple-700',
}

function BoothsTab({ eventId }: { eventId: number }) {
  const { toast } = useToast()
  const [boothsList, setBoothsList] = useState<BoothData[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [bNum, setBNum] = useState('')
  const [bSize, setBSize] = useState('')
  const [bDim, setBDim] = useState('')
  const [bZone, setBZone] = useState('')
  const [bPrice, setBPrice] = useState('')

  useState(() => {
    fetch(`/api/events/${eventId}/booths`)
      .then(r => r.json())
      .then(data => { setBoothsList(Array.isArray(data) ? data : data.data || []); setLoaded(true) })
  })

  async function addBooth(e: React.FormEvent) {
    e.preventDefault()
    if (!bNum.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/booths`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booth_number: bNum.trim(),
          size: bSize || null,
          dimensions: bDim || null,
          location_zone: bZone || null,
          price: bPrice ? Number(bPrice) : null,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const newBooth = await res.json()
      setBoothsList(prev => [...prev, newBooth])
      setBNum(''); setBSize(''); setBDim(''); setBZone(''); setBPrice('')
      setShowAdd(false)
      toast({ type: 'success', message: 'Booth added' })
    } catch {
      toast({ type: 'error', message: 'Failed to add booth' })
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return <div className="text-center py-12"><p className="text-sm text-text-tertiary">Loading...</p></div>

  const statusCounts = boothsList.reduce<Record<string, number>>((acc, b) => {
    const s = b.status || 'available'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-text-secondary">{boothsList.length} booth{boothsList.length !== 1 ? 's' : ''}</p>
          {Object.entries(statusCounts).map(([status, count]) => (
            <span key={status} className={`text-xs font-medium px-2 py-0.5 rounded-full ${BOOTH_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`}>
              {count} {status}
            </span>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-3.5 w-3.5" /> Add Booth</Button>
      </div>

      {showAdd && (
        <form onSubmit={addBooth} className="bg-surface rounded-xl border border-border p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <input type="text" value={bNum} onChange={e => setBNum(e.target.value)} placeholder="Booth # (e.g., A1)"
              autoFocus className="h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            <input type="text" value={bSize} onChange={e => setBSize(e.target.value)} placeholder="Size (e.g., small, large)"
              className="h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            <input type="text" value={bDim} onChange={e => setBDim(e.target.value)} placeholder="Dimensions (e.g., 3x3m)"
              className="h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={bZone} onChange={e => setBZone(e.target.value)} placeholder="Zone / Hall"
              className="h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            <input type="number" value={bPrice} onChange={e => setBPrice(e.target.value)} placeholder="Price (halalas)"
              className="h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" type="submit" loading={saving}>Add</Button>
          </div>
        </form>
      )}

      {boothsList.length === 0 && !showAdd ? (
        <div className="text-center py-12">
          <MapPin className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary">No booths yet. Add booths to manage the exhibition layout.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {boothsList.map(booth => (
            <div key={booth.id} className="bg-surface rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-text-primary">Booth {booth.booth_number}</h4>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${BOOTH_STATUS_COLORS[booth.status || 'available']}`}>
                  {booth.status || 'available'}
                </span>
              </div>
              <div className="space-y-1 text-xs text-text-secondary">
                {booth.size && <p>Size: {booth.size}</p>}
                {booth.dimensions && <p>Dimensions: {booth.dimensions}</p>}
                {booth.location_zone && <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {booth.location_zone}</p>}
                {booth.price && <p className="text-primary-600 font-medium">SAR {(booth.price / 100).toLocaleString()}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type RunSheetItem = {
  id: number
  title: string
  description: string | null
  scheduled_time: string | null
  duration_minutes: number | null
  location: string | null
  responsible_user_id: number | null
  status: string | null
  sort_order: number | null
  notes: string | null
  completed_at: string | null
  responsible_name: string | null
}

type EventIssue = {
  id: number
  title: string
  description: string | null
  severity: string | null
  status: string | null
  resolution: string | null
  resolved_at: string | null
  created_at: string | null
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

const RUN_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-200',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  skipped: 'bg-gray-400',
}

function EventDayTab({ eventId }: { eventId: number }) {
  const router = useRouter()
  const { toast } = useToast()
  const [subTab, setSubTab] = useState<'run_sheet' | 'issues'>('run_sheet')
  const [runSheet, setRunSheet] = useState<RunSheetItem[]>([])
  const [issues, setIssues] = useState<EventIssue[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [showIssueAdd, setShowIssueAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  // Run sheet form
  const [rsTitle, setRsTitle] = useState('')
  const [rsTime, setRsTime] = useState('')
  const [rsDuration, setRsDuration] = useState('')
  const [rsLocation, setRsLocation] = useState('')

  // Issue form
  const [issueTitle, setIssueTitle] = useState('')
  const [issueDesc, setIssueDesc] = useState('')
  const [issueSeverity, setIssueSeverity] = useState('medium')

  // Load data
  useState(() => {
    Promise.all([
      fetch(`/api/events/${eventId}/run-sheet`).then(r => r.json()),
      fetch(`/api/events/${eventId}/issues`).then(r => r.json()),
    ]).then(([rs, is]) => {
      setRunSheet(rs)
      setIssues(is)
      setLoaded(true)
    })
  })

  async function addRunSheetItem(e: React.FormEvent) {
    e.preventDefault()
    if (!rsTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/run-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: rsTitle.trim(),
          scheduled_time: rsTime || null,
          duration_minutes: rsDuration || null,
          location: rsLocation || null,
          sort_order: runSheet.length,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const item = await res.json()
      setRunSheet(prev => [...prev, { ...item, responsible_name: null }])
      setRsTitle(''); setRsTime(''); setRsDuration(''); setRsLocation('')
      setShowAdd(false)
      toast({ type: 'success', message: 'Item added' })
    } catch {
      toast({ type: 'error', message: 'Failed to add' })
    } finally {
      setSaving(false)
    }
  }

  async function updateRunSheetStatus(itemId: number, status: string) {
    try {
      await fetch(`/api/events/${eventId}/run-sheet`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, status }),
      })
      setRunSheet(prev => prev.map(item =>
        item.id === itemId ? { ...item, status, completed_at: status === 'completed' ? new Date().toISOString() : null } : item
      ))
    } catch {
      toast({ type: 'error', message: 'Failed to update' })
    }
  }

  async function addIssue(e: React.FormEvent) {
    e.preventDefault()
    if (!issueTitle.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: issueTitle.trim(),
          description: issueDesc || null,
          severity: issueSeverity,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const issue = await res.json()
      setIssues(prev => [issue, ...prev])
      setIssueTitle(''); setIssueDesc(''); setIssueSeverity('medium')
      setShowIssueAdd(false)
      toast({ type: 'success', message: 'Issue reported' })
    } catch {
      toast({ type: 'error', message: 'Failed to report issue' })
    } finally {
      setSaving(false)
    }
  }

  async function updateIssueStatus(issueId: number, status: string) {
    try {
      await fetch(`/api/events/${eventId}/issues`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue_id: issueId, status }),
      })
      setIssues(prev => prev.map(issue =>
        issue.id === issueId ? { ...issue, status, resolved_at: status === 'resolved' ? new Date().toISOString() : null } : issue
      ))
    } catch {
      toast({ type: 'error', message: 'Failed to update' })
    }
  }

  if (!loaded) {
    return <div className="text-center py-12"><p className="text-sm text-text-tertiary">Loading...</p></div>
  }

  const completedCount = runSheet.filter(i => i.status === 'completed').length
  const openIssues = issues.filter(i => i.status !== 'resolved').length

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setSubTab('run_sheet')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            subTab === 'run_sheet' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
          }`}
        >
          Run Sheet {runSheet.length > 0 && <span className="ml-1 text-xs">({completedCount}/{runSheet.length})</span>}
        </button>
        <button
          onClick={() => setSubTab('issues')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            subTab === 'issues' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
          }`}
        >
          Issues {openIssues > 0 && <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px]">{openIssues}</span>}
        </button>
      </div>

      {/* Run Sheet */}
      {subTab === 'run_sheet' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-text-secondary">{runSheet.length} items · {completedCount} completed</p>
            <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-3.5 w-3.5" /> Add Item</Button>
          </div>

          {/* Progress */}
          {runSheet.length > 0 && (
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${(completedCount / runSheet.length) * 100}%` }}
              />
            </div>
          )}

          {showAdd && (
            <form onSubmit={addRunSheetItem} className="bg-surface rounded-xl border border-border p-4 space-y-3">
              <input
                type="text"
                value={rsTitle}
                onChange={e => setRsTitle(e.target.value)}
                placeholder="Item title..."
                autoFocus
                className="w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="grid grid-cols-3 gap-2">
                <input type="datetime-local" value={rsTime} onChange={e => setRsTime(e.target.value)}
                  className="h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                <input type="number" value={rsDuration} onChange={e => setRsDuration(e.target.value)} placeholder="Duration (min)"
                  className="h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
                <input type="text" value={rsLocation} onChange={e => setRsLocation(e.target.value)} placeholder="Location"
                  className="h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button size="sm" type="submit" loading={saving}>Add</Button>
              </div>
            </form>
          )}

          {runSheet.length === 0 && !showAdd ? (
            <div className="text-center py-12">
              <PlayCircle className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">No run sheet items. Build your event-day schedule.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {runSheet.map((item, idx) => (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  item.status === 'completed' ? 'bg-green-50 border-green-200' :
                  item.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                  item.status === 'skipped' ? 'bg-gray-50 border-gray-200 opacity-60' :
                  'bg-surface border-border'
                }`}>
                  <div className={`w-3 h-3 rounded-full shrink-0 ${RUN_STATUS_COLORS[item.status || 'pending']}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.status === 'completed' ? 'text-green-700 line-through' : 'text-text-primary'}`}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-text-tertiary mt-0.5">
                      {item.scheduled_time && (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(item.scheduled_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                      {item.duration_minutes && <span>{item.duration_minutes}min</span>}
                      {item.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.location}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {item.status !== 'completed' && item.status !== 'skipped' && (
                      <>
                        {item.status !== 'in_progress' && (
                          <button onClick={() => updateRunSheetStatus(item.id, 'in_progress')}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 cursor-pointer">Start</button>
                        )}
                        <button onClick={() => updateRunSheetStatus(item.id, 'completed')}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 cursor-pointer">Done</button>
                        <button onClick={() => updateRunSheetStatus(item.id, 'skipped')}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 cursor-pointer">Skip</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Issues */}
      {subTab === 'issues' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-text-secondary">{issues.length} issue{issues.length !== 1 ? 's' : ''} · {openIssues} open</p>
            <Button size="sm" variant="danger" onClick={() => setShowIssueAdd(true)}><AlertTriangle className="h-3.5 w-3.5" /> Report Issue</Button>
          </div>

          {showIssueAdd && (
            <form onSubmit={addIssue} className="bg-surface rounded-xl border border-red-200 p-4 space-y-3">
              <input
                type="text"
                value={issueTitle}
                onChange={e => setIssueTitle(e.target.value)}
                placeholder="Issue title..."
                autoFocus
                className="w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <textarea
                value={issueDesc}
                onChange={e => setIssueDesc(e.target.value)}
                placeholder="Describe the issue..."
                rows={2}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <select value={issueSeverity} onChange={e => setIssueSeverity(e.target.value)}
                className="h-9 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowIssueAdd(false)}>Cancel</Button>
                <Button size="sm" variant="danger" type="submit" loading={saving}>Report</Button>
              </div>
            </form>
          )}

          {issues.length === 0 && !showIssueAdd ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">No issues reported. Use this to track problems during the event.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {issues.map(issue => (
                <div key={issue.id} className={`p-3 rounded-lg border ${
                  issue.status === 'resolved' ? 'bg-green-50 border-green-200' : 'bg-surface border-border'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`text-sm font-medium ${issue.status === 'resolved' ? 'text-green-700' : 'text-text-primary'}`}>
                          {issue.title}
                        </h4>
                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${SEVERITY_COLORS[issue.severity || 'medium']}`}>
                          {issue.severity}
                        </span>
                      </div>
                      {issue.description && <p className="text-xs text-text-secondary">{issue.description}</p>}
                      {issue.resolution && <p className="text-xs text-green-600 mt-1">Resolution: {issue.resolution}</p>}
                    </div>
                    {issue.status !== 'resolved' && (
                      <div className="flex gap-1 shrink-0">
                        {issue.status === 'open' && (
                          <button onClick={() => updateIssueStatus(issue.id, 'in_progress')}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 cursor-pointer">Working</button>
                        )}
                        <button onClick={() => updateIssueStatus(issue.id, 'resolved')}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 cursor-pointer">Resolve</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
