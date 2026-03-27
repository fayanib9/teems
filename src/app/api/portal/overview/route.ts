import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import {
  clients, events, vendors, event_vendors, speakers, event_speakers,
  sessions, exhibitors, event_exhibitors, booths, documents, approvals,
} from '@/db/schema'
import { eq, and, count, inArray } from 'drizzle-orm'

const EXTERNAL_ROLES = ['client', 'vendor', 'speaker', 'exhibitor']

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!EXTERNAL_ROLES.includes(session.role_name)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (session.role_name === 'client') {
      const clientRecord = await db
        .select({ id: clients.id, name: clients.name })
        .from(clients)
        .where(eq(clients.user_id, session.id))
        .limit(1)

      if (!clientRecord[0]) return NextResponse.json({ error: 'No linked client record' }, { status: 404 })

      const clientId = clientRecord[0].id

      const eventRows = await db
        .select({ id: events.id, title: events.title, status: events.status, start_date: events.start_date })
        .from(events)
        .where(eq(events.client_id, clientId))

      const eventIds = eventRows.map(e => e.id)

      let pendingApprovalsCount = 0
      let documentsCount = 0

      if (eventIds.length > 0) {
        const [appResult] = await db
          .select({ count: count() })
          .from(approvals)
          .where(and(inArray(approvals.event_id, eventIds), eq(approvals.status, 'pending')))
        pendingApprovalsCount = appResult.count

        const [docResult] = await db
          .select({ count: count() })
          .from(documents)
          .where(inArray(documents.event_id, eventIds))
        documentsCount = docResult.count
      }

      return NextResponse.json({
        role: 'client',
        client: clientRecord[0],
        events_count: eventRows.length,
        recent_events: eventRows.slice(0, 5),
        pending_approvals_count: pendingApprovalsCount,
        documents_count: documentsCount,
      })
    }

    if (session.role_name === 'vendor') {
      const vendorRecord = await db
        .select({ id: vendors.id, name: vendors.name })
        .from(vendors)
        .where(eq(vendors.user_id, session.id))
        .limit(1)

      if (!vendorRecord[0]) return NextResponse.json({ error: 'No linked vendor record' }, { status: 404 })

      const vendorId = vendorRecord[0].id

      const assignments = await db
        .select({
          event_id: event_vendors.event_id,
          status: event_vendors.status,
          service_description: event_vendors.service_description,
          event_title: events.title,
          event_status: events.status,
          start_date: events.start_date,
        })
        .from(event_vendors)
        .innerJoin(events, eq(event_vendors.event_id, events.id))
        .where(eq(event_vendors.vendor_id, vendorId))

      const pendingItems = assignments.filter(a => a.status === 'pending').length

      return NextResponse.json({
        role: 'vendor',
        vendor: vendorRecord[0],
        assignments_count: assignments.length,
        recent_assignments: assignments.slice(0, 5),
        pending_items: pendingItems,
      })
    }

    if (session.role_name === 'speaker') {
      const speakerRecord = await db
        .select({ id: speakers.id, name: speakers.name })
        .from(speakers)
        .where(eq(speakers.user_id, session.id))
        .limit(1)

      if (!speakerRecord[0]) return NextResponse.json({ error: 'No linked speaker record' }, { status: 404 })

      const speakerId = speakerRecord[0].id

      const speakerSessions = await db
        .select({
          session_id: event_speakers.session_id,
          event_id: event_speakers.event_id,
          role: event_speakers.role,
          event_title: events.title,
          event_status: events.status,
          start_date: events.start_date,
          session_title: sessions.title,
          session_date: sessions.date,
          start_time: sessions.start_time,
        })
        .from(event_speakers)
        .innerJoin(events, eq(event_speakers.event_id, events.id))
        .leftJoin(sessions, eq(event_speakers.session_id, sessions.id))
        .where(eq(event_speakers.speaker_id, speakerId))

      const upcomingEvents = speakerSessions.filter(s => s.start_date && s.start_date > new Date()).length

      return NextResponse.json({
        role: 'speaker',
        speaker: speakerRecord[0],
        sessions_count: speakerSessions.length,
        recent_sessions: speakerSessions.slice(0, 5),
        upcoming_events: upcomingEvents,
      })
    }

    if (session.role_name === 'exhibitor') {
      const exhibitorRecord = await db
        .select({ id: exhibitors.id, name: exhibitors.name })
        .from(exhibitors)
        .where(eq(exhibitors.user_id, session.id))
        .limit(1)

      if (!exhibitorRecord[0]) return NextResponse.json({ error: 'No linked exhibitor record' }, { status: 404 })

      const exhibitorId = exhibitorRecord[0].id

      const boothAssignments = await db
        .select({
          event_id: event_exhibitors.event_id,
          booth_id: event_exhibitors.booth_id,
          status: event_exhibitors.status,
          event_title: events.title,
          event_status: events.status,
          start_date: events.start_date,
          booth_number: booths.booth_number,
          location_zone: booths.location_zone,
        })
        .from(event_exhibitors)
        .innerJoin(events, eq(event_exhibitors.event_id, events.id))
        .leftJoin(booths, eq(event_exhibitors.booth_id, booths.id))
        .where(eq(event_exhibitors.exhibitor_id, exhibitorId))

      return NextResponse.json({
        role: 'exhibitor',
        exhibitor: exhibitorRecord[0],
        booth_assignments_count: boothAssignments.length,
        recent_assignments: boothAssignments.slice(0, 5),
      })
    }

    return NextResponse.json({ error: 'Unknown role' }, { status: 400 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
