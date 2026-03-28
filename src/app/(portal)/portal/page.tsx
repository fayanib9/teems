import { getSession } from '@/lib/auth'
import { db } from '@/db'
import {
  events, clients, vendors, speakers, exhibitors,
  event_vendors, event_speakers, event_exhibitors,
  documents, approvals, sessions as sessionsTable, booths,
} from '@/db/schema'
import { eq, and, count, sql, desc } from 'drizzle-orm'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  CalendarDays, FileText, ClipboardCheck, DollarSign,
  Mic, MapPin, Clock, Timer, CheckCircle2, Circle,
  Briefcase, Users,
} from 'lucide-react'
import Link from 'next/link'
import { PortalDashboardClient } from './portal-dashboard-client'

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
      budget_estimated: events.budget_estimated,
      budget_actual: events.budget_actual,
    })
    .from(events)
    .where(eq(events.client_id, client.id))
    .orderBy(events.start_date)

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

  // Recent documents
  let recentDocs: { id: number; title: string; category: string | null; created_at: Date | null }[] = []
  if (eventIds.length > 0) {
    recentDocs = await db
      .select({ id: documents.id, title: documents.title, category: documents.category, created_at: documents.created_at })
      .from(documents)
      .where(sql`${documents.event_id} IN (${sql.join(eventIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(desc(documents.created_at))
      .limit(5)
  }

  // Upcoming events sorted
  const upcomingEvents = clientEvents
    .filter(e => e.start_date > new Date())
    .sort((a, b) => a.start_date.getTime() - b.start_date.getTime())

  // Serialize dates for client component
  const dashboardData = {
    role: 'client' as const,
    stats: {
      eventCount: clientEvents.length,
      pendingApprovals: approvalCount.count,
      documentCount: docCount.count,
      activeEvents: clientEvents.filter(e => e.status === 'in_progress').length,
    },
    events: clientEvents.map(e => ({
      id: e.id,
      title: e.title,
      status: e.status,
      start_date: e.start_date.toISOString(),
      end_date: e.end_date.toISOString(),
      venue_name: e.venue_name,
    })),
    upcomingEvent: upcomingEvents[0] ? {
      title: upcomingEvents[0].title,
      start_date: upcomingEvents[0].start_date.toISOString(),
    } : null,
    recentDocuments: recentDocs.map(d => ({
      id: d.id,
      title: d.title,
      category: d.category,
      created_at: d.created_at?.toISOString() ?? null,
    })),
  }

  return <PortalDashboardClient data={dashboardData} name={name} />
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
      service_description: event_vendors.service_description,
    })
    .from(event_vendors)
    .innerJoin(events, eq(event_vendors.event_id, events.id))
    .where(eq(event_vendors.vendor_id, vendor.id))
    .orderBy(events.start_date)

  const totalContract = assignments.reduce((sum, a) => sum + (a.contract_amount || 0), 0)
  const pendingCount = assignments.filter(a => a.assignment_status === 'pending').length

  const dashboardData = {
    role: 'vendor' as const,
    stats: {
      assignedEvents: assignments.length,
      contractTotal: totalContract,
      activeEvents: assignments.filter(a => a.status === 'in_progress').length,
      pendingDeliverables: pendingCount,
    },
    events: assignments.map(a => ({
      id: a.id,
      title: a.title,
      status: a.status,
      start_date: a.start_date.toISOString(),
      end_date: a.end_date.toISOString(),
      venue_name: a.venue_name,
      assignment_status: a.assignment_status,
      service_description: a.service_description,
    })),
  }

  return <PortalDashboardClient data={dashboardData} name={name} />
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
      assignment_status: event_speakers.status,
      travel_required: event_speakers.travel_required,
      session_id: event_speakers.session_id,
      session_title: sessionsTable.title,
      session_date: sessionsTable.date,
      session_start_time: sessionsTable.start_time,
      session_end_time: sessionsTable.end_time,
      session_location: sessionsTable.location,
    })
    .from(event_speakers)
    .innerJoin(events, eq(event_speakers.event_id, events.id))
    .leftJoin(sessionsTable, eq(event_speakers.session_id, sessionsTable.id))
    .where(eq(event_speakers.speaker_id, speaker.id))
    .orderBy(sessionsTable.date)

  const upcomingSessions = assignments.filter(a => a.session_date && a.session_date > new Date())
  const travelConfirmed = assignments.some(a => a.travel_required && a.assignment_status === 'confirmed')

  const dashboardData = {
    role: 'speaker' as const,
    stats: {
      eventCount: new Set(assignments.map(a => a.id)).size,
      upcomingSessions: upcomingSessions.length,
      activeEvents: assignments.filter(a => a.status === 'in_progress').length,
    },
    checklist: {
      bioSubmitted: !!speaker.bio,
      photoUploaded: !!speaker.photo_path,
      presentationSubmitted: false, // Would check documents table
      travelConfirmed: travelConfirmed,
    },
    sessions: assignments.filter(a => a.session_title).map(a => ({
      event_title: a.title,
      session_title: a.session_title!,
      session_date: a.session_date?.toISOString() ?? null,
      session_start_time: a.session_start_time,
      session_end_time: a.session_end_time,
      session_location: a.session_location,
      status: a.assignment_status,
    })),
    events: assignments.map(a => ({
      id: a.id,
      title: a.title,
      status: a.status,
      start_date: a.start_date.toISOString(),
      end_date: a.end_date.toISOString(),
      venue_name: a.venue_name,
    })),
  }

  return <PortalDashboardClient data={dashboardData} name={name} />
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
      assignment_status: event_exhibitors.status,
      package_type: event_exhibitors.package_type,
      booth_number: booths.booth_number,
      booth_zone: booths.location_zone,
      booth_size: booths.size,
      booth_dimensions: booths.dimensions,
    })
    .from(event_exhibitors)
    .innerJoin(events, eq(event_exhibitors.event_id, events.id))
    .leftJoin(booths, eq(event_exhibitors.booth_id, booths.id))
    .where(eq(event_exhibitors.exhibitor_id, exhibitor.id))
    .orderBy(events.start_date)

  const boothCount = assignments.filter(a => a.booth_number).length

  const dashboardData = {
    role: 'exhibitor' as const,
    stats: {
      eventCount: assignments.length,
      boothAssignments: boothCount,
      activeEvents: assignments.filter(a => a.status === 'in_progress').length,
    },
    checklist: {
      logoSubmitted: !!exhibitor.logo_path,
      paymentConfirmed: assignments.some(a => a.assignment_status === 'confirmed'),
      setupScheduled: boothCount > 0,
    },
    booths: assignments.filter(a => a.booth_number).map(a => ({
      event_title: a.title,
      booth_number: a.booth_number!,
      booth_zone: a.booth_zone,
      booth_size: a.booth_size,
      package_type: a.package_type,
      start_date: a.start_date.toISOString(),
    })),
    events: assignments.map(a => ({
      id: a.id,
      title: a.title,
      status: a.status,
      start_date: a.start_date.toISOString(),
      end_date: a.end_date.toISOString(),
      venue_name: a.venue_name,
    })),
  }

  return <PortalDashboardClient data={dashboardData} name={name} />
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
