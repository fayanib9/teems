import { getSession } from '@/lib/auth'
import { db } from '@/db'
import {
  events, clients, vendors, speakers, exhibitors,
  event_vendors, event_speakers, event_exhibitors,
  documents, approvals, sessions as sessionsTable, booths,
} from '@/db/schema'
import { eq, and, count, sum, sql } from 'drizzle-orm'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  CalendarDays, FileText, ClipboardCheck, DollarSign,
  Mic, MapPin, Clock,
} from 'lucide-react'
import Link from 'next/link'

export default async function PortalOverviewPage() {
  const session = await getSession()
  if (!session) return null

  const role = session.role_name

  if (role === 'client') return <ClientDashboard userId={session.id} name={session.first_name} />
  if (role === 'vendor') return <VendorDashboard userId={session.id} name={session.first_name} />
  if (role === 'speaker') return <SpeakerDashboard userId={session.id} name={session.first_name} />
  if (role === 'exhibitor') return <ExhibitorDashboard userId={session.id} name={session.first_name} />

  return null
}

async function ClientDashboard({ userId, name }: { userId: number; name: string }) {
  const [client] = await db.select().from(clients).where(eq(clients.user_id, userId)).limit(1)
  if (!client) return <NoEntity role="client" />

  const clientEvents = await db
    .select({
      id: events.id,
      title: events.title,
      status: events.status,
      start_date: events.start_date,
      end_date: events.end_date,
      venue_name: events.venue_name,
    })
    .from(events)
    .where(eq(events.client_id, client.id))

  const eventIds = clientEvents.map(e => e.id)

  const [docCount] = eventIds.length > 0
    ? await db.select({ count: count() }).from(documents).where(sql`${documents.event_id} IN (${sql.join(eventIds.map(id => sql`${id}`), sql`, `)})`)
    : [{ count: 0 }]

  const [approvalCount] = eventIds.length > 0
    ? await db.select({ count: count() }).from(approvals).where(and(
        sql`${approvals.event_id} IN (${sql.join(eventIds.map(id => sql`${id}`), sql`, `)})`,
        eq(approvals.status, 'pending')
      ))
    : [{ count: 0 }]

  return (
    <>
      <PageHeader
        title={`Welcome back, ${name}`}
        description="Overview of your events and pending items"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="My Events" value={clientEvents.length} icon={CalendarDays} />
        <StatCard title="Pending Approvals" value={approvalCount.count} icon={ClipboardCheck} />
        <StatCard title="Documents" value={docCount.count} icon={FileText} />
        <StatCard
          title="Active Events"
          value={clientEvents.filter(e => e.status === 'in_progress').length}
          icon={Clock}
        />
      </div>
      <EventList events={clientEvents} />
    </>
  )
}

async function VendorDashboard({ userId, name }: { userId: number; name: string }) {
  const [vendor] = await db.select().from(vendors).where(eq(vendors.user_id, userId)).limit(1)
  if (!vendor) return <NoEntity role="vendor" />

  const assignments = await db
    .select({
      id: events.id,
      title: events.title,
      status: events.status,
      start_date: events.start_date,
      end_date: events.end_date,
      venue_name: events.venue_name,
      contract_amount: event_vendors.contract_amount,
      assignment_status: event_vendors.status,
    })
    .from(event_vendors)
    .innerJoin(events, eq(event_vendors.event_id, events.id))
    .where(eq(event_vendors.vendor_id, vendor.id))

  const totalContract = assignments.reduce((sum, a) => sum + (a.contract_amount || 0), 0)

  return (
    <>
      <PageHeader
        title={`Welcome back, ${name}`}
        description="Overview of your assigned events and contracts"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Assigned Events" value={assignments.length} icon={CalendarDays} />
        <StatCard title="Contract Total" value={formatCurrency(totalContract)} icon={DollarSign} />
        <StatCard
          title="Active Events"
          value={assignments.filter(a => a.status === 'in_progress').length}
          icon={Clock}
        />
      </div>
      <EventList events={assignments} />
    </>
  )
}

async function SpeakerDashboard({ userId, name }: { userId: number; name: string }) {
  const [speaker] = await db.select().from(speakers).where(eq(speakers.user_id, userId)).limit(1)
  if (!speaker) return <NoEntity role="speaker" />

  const assignments = await db
    .select({
      id: events.id,
      title: events.title,
      status: events.status,
      start_date: events.start_date,
      end_date: events.end_date,
      venue_name: events.venue_name,
    })
    .from(event_speakers)
    .innerJoin(events, eq(event_speakers.event_id, events.id))
    .where(eq(event_speakers.speaker_id, speaker.id))

  const upcomingSessions = await db
    .select({ count: count() })
    .from(event_speakers)
    .innerJoin(sessionsTable, eq(event_speakers.session_id, sessionsTable.id))
    .where(and(
      eq(event_speakers.speaker_id, speaker.id),
      sql`${sessionsTable.date} >= NOW()`
    ))

  return (
    <>
      <PageHeader
        title={`Welcome back, ${name}`}
        description="Overview of your upcoming sessions and events"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="My Events" value={assignments.length} icon={CalendarDays} />
        <StatCard title="Upcoming Sessions" value={upcomingSessions[0]?.count ?? 0} icon={Mic} />
        <StatCard
          title="Active Events"
          value={assignments.filter(a => a.status === 'in_progress').length}
          icon={Clock}
        />
      </div>
      <EventList events={assignments} />
    </>
  )
}

async function ExhibitorDashboard({ userId, name }: { userId: number; name: string }) {
  const [exhibitor] = await db.select().from(exhibitors).where(eq(exhibitors.user_id, userId)).limit(1)
  if (!exhibitor) return <NoEntity role="exhibitor" />

  const assignments = await db
    .select({
      id: events.id,
      title: events.title,
      status: events.status,
      start_date: events.start_date,
      end_date: events.end_date,
      venue_name: events.venue_name,
      booth_number: booths.booth_number,
      booth_zone: booths.location_zone,
    })
    .from(event_exhibitors)
    .innerJoin(events, eq(event_exhibitors.event_id, events.id))
    .leftJoin(booths, eq(event_exhibitors.booth_id, booths.id))
    .where(eq(event_exhibitors.exhibitor_id, exhibitor.id))

  const boothCount = assignments.filter(a => a.booth_number).length

  return (
    <>
      <PageHeader
        title={`Welcome back, ${name}`}
        description="Overview of your booth assignments and events"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="My Events" value={assignments.length} icon={CalendarDays} />
        <StatCard title="Booth Assignments" value={boothCount} icon={MapPin} />
        <StatCard
          title="Active Events"
          value={assignments.filter(a => a.status === 'in_progress').length}
          icon={Clock}
        />
      </div>
      <EventList events={assignments} />
    </>
  )
}

function NoEntity({ role }: { role: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-text-secondary text-sm">
        No {role} profile is linked to your account. Please contact your administrator.
      </p>
    </div>
  )
}

function EventList({ events: eventList }: { events: { id: number; title: string; status: string; start_date: Date; end_date: Date; venue_name: string | null }[] }) {
  if (eventList.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-border p-8 text-center">
        <p className="text-sm text-text-secondary">No events found.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-text-primary mb-4">Events</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {eventList.map(event => (
          <Link
            key={event.id}
            href={`/portal/events`}
            className="bg-surface rounded-xl border border-border p-5 hover:border-primary-200 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-primary">{event.title}</h3>
              <StatusBadge type="event" value={event.status} />
            </div>
            <div className="space-y-1.5 text-xs text-text-secondary">
              <p>{formatDate(event.start_date)} - {formatDate(event.end_date)}</p>
              {event.venue_name && <p>{event.venue_name}</p>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
