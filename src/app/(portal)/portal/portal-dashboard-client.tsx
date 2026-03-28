'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  CalendarDays, FileText, ClipboardCheck, DollarSign,
  Mic, MapPin, Clock, Timer, CheckCircle2, Circle,
  Briefcase, Users, Package, MessageSquare, GitBranch,
} from 'lucide-react'

type EventItem = {
  id: number
  title: string
  status: string
  start_date: string
  end_date: string
  venue_name: string | null
}

type ClientData = {
  role: 'client'
  stats: { eventCount: number; pendingApprovals: number; documentCount: number; activeEvents: number }
  events: EventItem[]
  upcomingEvent: { title: string; start_date: string } | null
  recentDocuments: { id: number; title: string; category: string | null; created_at: string | null }[]
}

type VendorData = {
  role: 'vendor'
  stats: { assignedEvents: number; contractTotal: number; activeEvents: number; pendingDeliverables: number }
  events: (EventItem & { assignment_status: string | null; service_description: string | null })[]
}

type SpeakerData = {
  role: 'speaker'
  stats: { eventCount: number; upcomingSessions: number; activeEvents: number }
  checklist: { bioSubmitted: boolean; photoUploaded: boolean; presentationSubmitted: boolean; travelConfirmed: boolean }
  sessions: {
    event_title: string; session_title: string; session_date: string | null
    session_start_time: string | null; session_end_time: string | null; session_location: string | null
    status: string | null
  }[]
  events: EventItem[]
}

type ExhibitorData = {
  role: 'exhibitor'
  stats: { eventCount: number; boothAssignments: number; activeEvents: number }
  checklist: { logoSubmitted: boolean; paymentConfirmed: boolean; setupScheduled: boolean }
  booths: {
    event_title: string; booth_number: string; booth_zone: string | null
    booth_size: string | null; package_type: string | null; start_date: string
  }[]
  events: EventItem[]
}

type DashboardData = ClientData | VendorData | SpeakerData | ExhibitorData

function CountdownWidget({ title, targetDate }: { title: string; targetDate: string }) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 })

  useEffect(() => {
    function update() {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0 })
        return
      }
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      })
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [targetDate])

  return (
    <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-5 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="h-4 w-4 opacity-80" />
        <p className="text-sm font-medium opacity-90">Next Event</p>
      </div>
      <p className="text-base font-semibold mb-4 line-clamp-1">{title}</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/15 rounded-lg p-2 text-center">
          <p className="text-2xl font-bold">{countdown.days}</p>
          <p className="text-[10px] uppercase tracking-wider opacity-80">Days</p>
        </div>
        <div className="bg-white/15 rounded-lg p-2 text-center">
          <p className="text-2xl font-bold">{countdown.hours}</p>
          <p className="text-[10px] uppercase tracking-wider opacity-80">Hours</p>
        </div>
        <div className="bg-white/15 rounded-lg p-2 text-center">
          <p className="text-2xl font-bold">{countdown.minutes}</p>
          <p className="text-[10px] uppercase tracking-wider opacity-80">Minutes</p>
        </div>
      </div>
    </div>
  )
}

function ChecklistItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {checked ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-text-tertiary shrink-0" />
      )}
      <span className={`text-sm ${checked ? 'text-text-primary' : 'text-text-secondary'}`}>
        {label}
      </span>
    </div>
  )
}

function ProgressBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-tertiary">{pct}%</span>
      </div>
      <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function EventCard({ event }: { event: EventItem }) {
  const now = new Date()
  const start = new Date(event.start_date)
  const end = new Date(event.end_date)
  const totalDuration = end.getTime() - start.getTime()
  const elapsed = Math.max(0, now.getTime() - start.getTime())
  const progress = totalDuration > 0 ? Math.min(Math.round((elapsed / totalDuration) * 100), 100) : 0
  const isUpcoming = start > now

  return (
    <Link
      href="/portal/events"
      className="bg-surface rounded-xl border border-border p-5 hover:border-primary-200 transition-colors block"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary line-clamp-1">{event.title}</h3>
        <StatusBadge type="event" value={event.status} />
      </div>
      <div className="space-y-1.5 text-xs text-text-secondary mb-3">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-text-tertiary" />
          <span>{formatDate(event.start_date)} - {formatDate(event.end_date)}</span>
        </div>
        {event.venue_name && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-text-tertiary" />
            <span>{event.venue_name}</span>
          </div>
        )}
      </div>
      {!isUpcoming && event.status !== 'draft' && event.status !== 'cancelled' && (
        <ProgressBar label="Event progress" value={progress} max={100} />
      )}
    </Link>
  )
}

export function PortalDashboardClient({ data, name }: { data: DashboardData; name: string }) {
  if (data.role === 'client') return <ClientView data={data} name={name} />
  if (data.role === 'vendor') return <VendorView data={data} name={name} />
  if (data.role === 'speaker') return <SpeakerView data={data} name={name} />
  if (data.role === 'exhibitor') return <ExhibitorView data={data} name={name} />
  return null
}

function ClientView({ data, name }: { data: ClientData; name: string }) {
  return (
    <>
      <PageHeader
        title={`Welcome back, ${name}`}
        description="Overview of your events and pending items"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard title="My Events" value={data.stats.eventCount} icon={CalendarDays} />
            <StatCard title="Pending Approvals" value={data.stats.pendingApprovals} icon={ClipboardCheck} />
            <StatCard title="Documents" value={data.stats.documentCount} icon={FileText} />
            <StatCard title="Active Events" value={data.stats.activeEvents} icon={Clock} />
          </div>
        </div>

        {data.upcomingEvent && (
          <CountdownWidget
            title={data.upcomingEvent.title}
            targetDate={data.upcomingEvent.start_date}
          />
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Link href="/portal/approvals" className="bg-surface rounded-xl border border-border p-4 hover:border-primary-200 transition-colors text-center group">
          <ClipboardCheck className="h-5 w-5 text-primary-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-medium text-text-primary">Review Approvals</p>
        </Link>
        <Link href="/portal/messages" className="bg-surface rounded-xl border border-border p-4 hover:border-primary-200 transition-colors text-center group">
          <MessageSquare className="h-5 w-5 text-primary-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-medium text-text-primary">Messages</p>
        </Link>
        <Link href="/portal/change-requests" className="bg-surface rounded-xl border border-border p-4 hover:border-primary-200 transition-colors text-center group">
          <GitBranch className="h-5 w-5 text-primary-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-medium text-text-primary">Change Requests</p>
        </Link>
        <Link href="/portal/documents" className="bg-surface rounded-xl border border-border p-4 hover:border-primary-200 transition-colors text-center group">
          <FileText className="h-5 w-5 text-primary-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-medium text-text-primary">Documents</p>
        </Link>
      </div>

      {/* Events with progress */}
      {data.events.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-text-primary mb-4">Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Event Timeline */}
      {data.events.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-text-primary mb-4">Event Timeline</h2>
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="relative">
              <div className="absolute top-0 bottom-0 left-3 w-0.5 bg-border" />
              {data.events.map((event, idx) => {
                const now = new Date()
                const start = new Date(event.start_date)
                const isPast = start < now
                const isCurrent = event.status === 'in_progress' || event.status === 'confirmed'
                return (
                  <div key={event.id} className="relative pl-8 pb-6 last:pb-0">
                    <div className={`absolute left-1.5 top-1 h-3.5 w-3.5 rounded-full border-2 ${
                      isCurrent ? 'bg-primary-500 border-primary-500' :
                      isPast ? 'bg-green-500 border-green-500' :
                      'bg-surface border-border'
                    }`} />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{event.title}</p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {formatDate(event.start_date)} — {formatDate(event.end_date)}
                        </p>
                      </div>
                      <StatusBadge type="event" value={event.status} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recent documents */}
      {data.recentDocuments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">Recent Documents</h2>
            <Link href="/portal/documents" className="text-xs text-primary-500 hover:text-primary-600 font-medium">
              View all
            </Link>
          </div>
          <div className="bg-surface rounded-xl border border-border divide-y divide-border">
            {data.recentDocuments.map(doc => (
              <div key={doc.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-primary-500" />
                  <span className="text-sm text-text-primary">{doc.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  {doc.category && <Badge color="blue">{doc.category}</Badge>}
                  <span className="text-xs text-text-tertiary">{formatDate(doc.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function VendorView({ data, name }: { data: VendorData; name: string }) {
  return (
    <>
      <PageHeader
        title={`Welcome back, ${name}`}
        description="Overview of your assigned events and contracts"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Assigned Events" value={data.stats.assignedEvents} icon={CalendarDays} />
        <StatCard title="Contract Total" value={formatCurrency(data.stats.contractTotal)} icon={DollarSign} />
        <StatCard title="Active Events" value={data.stats.activeEvents} icon={Clock} />
        <StatCard title="Pending Items" value={data.stats.pendingDeliverables} icon={ClipboardCheck} />
      </div>

      {data.events.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-text-primary mb-4">Assigned Events</h2>
          <div className="space-y-3">
            {data.events.map(event => (
              <div key={event.id} className="bg-surface rounded-xl border border-border p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{event.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-1">
                      <CalendarDays className="h-3.5 w-3.5 text-text-tertiary" />
                      <span>{formatDate(event.start_date)} - {formatDate(event.end_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge type="event" value={event.status} />
                    {event.assignment_status && (
                      <Badge color={
                        event.assignment_status === 'confirmed' ? 'green' :
                        event.assignment_status === 'pending' ? 'amber' : 'gray'
                      }>
                        {event.assignment_status}
                      </Badge>
                    )}
                  </div>
                </div>
                {event.service_description && (
                  <p className="text-xs text-text-tertiary mt-2">{event.service_description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.events.length === 0 && (
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          <p className="text-sm text-text-secondary">No events assigned.</p>
        </div>
      )}
    </>
  )
}

function SpeakerView({ data, name }: { data: SpeakerData; name: string }) {
  const checklistDone = Object.values(data.checklist).filter(Boolean).length
  const checklistTotal = Object.keys(data.checklist).length

  return (
    <>
      <PageHeader
        title={`Welcome back, ${name}`}
        description="Overview of your upcoming sessions and events"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="My Events" value={data.stats.eventCount} icon={CalendarDays} />
          <StatCard title="Upcoming Sessions" value={data.stats.upcomingSessions} icon={Mic} />
          <StatCard title="Active Events" value={data.stats.activeEvents} icon={Clock} />
        </div>

        {/* Pre-event checklist */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Pre-event Checklist</h3>
            <span className="text-xs text-text-tertiary">{checklistDone}/{checklistTotal}</span>
          </div>
          <ProgressBar label="" value={checklistDone} max={checklistTotal} />
          <div className="mt-3 space-y-0.5">
            <ChecklistItem checked={data.checklist.bioSubmitted} label="Bio submitted" />
            <ChecklistItem checked={data.checklist.photoUploaded} label="Photo uploaded" />
            <ChecklistItem checked={data.checklist.presentationSubmitted} label="Presentation submitted" />
            <ChecklistItem checked={data.checklist.travelConfirmed} label="Travel confirmed" />
          </div>
        </div>
      </div>

      {/* Upcoming sessions */}
      {data.sessions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">Upcoming Sessions</h2>
            <Link href="/portal/sessions" className="text-xs text-primary-500 hover:text-primary-600 font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {data.sessions.slice(0, 5).map((s, i) => (
              <div key={i} className="bg-surface rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{s.session_title}</h3>
                    <p className="text-xs text-text-tertiary mt-0.5">{s.event_title}</p>
                  </div>
                  {s.status && (
                    <Badge color={
                      s.status === 'confirmed' ? 'green' :
                      s.status === 'invited' ? 'blue' : 'gray'
                    }>
                      {s.status}
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-text-secondary">
                  {s.session_date && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3 text-text-tertiary" />
                      {formatDate(s.session_date)}
                    </span>
                  )}
                  {s.session_start_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-text-tertiary" />
                      {s.session_start_time} - {s.session_end_time}
                    </span>
                  )}
                  {s.session_location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-text-tertiary" />
                      {s.session_location}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function ExhibitorView({ data, name }: { data: ExhibitorData; name: string }) {
  const checklistDone = Object.values(data.checklist).filter(Boolean).length
  const checklistTotal = Object.keys(data.checklist).length

  return (
    <>
      <PageHeader
        title={`Welcome back, ${name}`}
        description="Overview of your booth assignments and events"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="My Events" value={data.stats.eventCount} icon={CalendarDays} />
          <StatCard title="Booth Assignments" value={data.stats.boothAssignments} icon={MapPin} />
          <StatCard title="Active Events" value={data.stats.activeEvents} icon={Clock} />
        </div>

        {/* Pre-event checklist */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Pre-event Checklist</h3>
            <span className="text-xs text-text-tertiary">{checklistDone}/{checklistTotal}</span>
          </div>
          <ProgressBar label="" value={checklistDone} max={checklistTotal} />
          <div className="mt-3 space-y-0.5">
            <ChecklistItem checked={data.checklist.logoSubmitted} label="Logo submitted" />
            <ChecklistItem checked={data.checklist.paymentConfirmed} label="Payment confirmed" />
            <ChecklistItem checked={data.checklist.setupScheduled} label="Setup scheduled" />
          </div>
        </div>
      </div>

      {/* Booth details */}
      {data.booths.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">Booth Assignments</h2>
            <Link href="/portal/booth" className="text-xs text-primary-500 hover:text-primary-600 font-medium">
              View details
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.booths.map((b, i) => (
              <div key={i} className="bg-surface rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-2">{b.event_title}</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-text-tertiary">Booth</p>
                    <p className="font-semibold text-text-primary">#{b.booth_number}</p>
                  </div>
                  {b.booth_zone && (
                    <div>
                      <p className="text-text-tertiary">Zone</p>
                      <p className="font-medium text-text-primary">{b.booth_zone}</p>
                    </div>
                  )}
                  {b.booth_size && (
                    <div>
                      <p className="text-text-tertiary">Size</p>
                      <p className="font-medium text-text-primary">{b.booth_size}</p>
                    </div>
                  )}
                  {b.package_type && (
                    <div>
                      <p className="text-text-tertiary">Package</p>
                      <Badge color="purple">{b.package_type}</Badge>
                    </div>
                  )}
                </div>
                <p className="text-xs text-text-tertiary mt-3">
                  Event starts: {formatDate(b.start_date)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events */}
      {data.events.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-text-primary mb-4">Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
