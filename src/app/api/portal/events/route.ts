import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import {
  clients, events, vendors, event_vendors, speakers, event_speakers,
  exhibitors, event_exhibitors,
} from '@/db/schema'
import { eq } from 'drizzle-orm'

const EXTERNAL_ROLES = ['client', 'vendor', 'speaker', 'exhibitor']

const eventFields = {
  id: events.id,
  title: events.title,
  status: events.status,
  start_date: events.start_date,
  end_date: events.end_date,
  venue_name: events.venue_name,
  venue_city: events.venue_city,
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!EXTERNAL_ROLES.includes(session.role_name)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (session.role_name === 'client') {
      const clientRecord = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.user_id, session.id))
        .limit(1)

      if (!clientRecord[0]) return NextResponse.json({ error: 'No linked client record' }, { status: 404 })

      const rows = await db
        .select(eventFields)
        .from(events)
        .where(eq(events.client_id, clientRecord[0].id))

      return NextResponse.json({ data: rows })
    }

    if (session.role_name === 'vendor') {
      const vendorRecord = await db
        .select({ id: vendors.id })
        .from(vendors)
        .where(eq(vendors.user_id, session.id))
        .limit(1)

      if (!vendorRecord[0]) return NextResponse.json({ error: 'No linked vendor record' }, { status: 404 })

      const rows = await db
        .select({
          ...eventFields,
          vendor_status: event_vendors.status,
          service_description: event_vendors.service_description,
        })
        .from(event_vendors)
        .innerJoin(events, eq(event_vendors.event_id, events.id))
        .where(eq(event_vendors.vendor_id, vendorRecord[0].id))

      return NextResponse.json({ data: rows })
    }

    if (session.role_name === 'speaker') {
      const speakerRecord = await db
        .select({ id: speakers.id })
        .from(speakers)
        .where(eq(speakers.user_id, session.id))
        .limit(1)

      if (!speakerRecord[0]) return NextResponse.json({ error: 'No linked speaker record' }, { status: 404 })

      const rows = await db
        .select({
          ...eventFields,
          speaker_role: event_speakers.role,
          speaker_status: event_speakers.status,
        })
        .from(event_speakers)
        .innerJoin(events, eq(event_speakers.event_id, events.id))
        .where(eq(event_speakers.speaker_id, speakerRecord[0].id))

      return NextResponse.json({ data: rows })
    }

    if (session.role_name === 'exhibitor') {
      const exhibitorRecord = await db
        .select({ id: exhibitors.id })
        .from(exhibitors)
        .where(eq(exhibitors.user_id, session.id))
        .limit(1)

      if (!exhibitorRecord[0]) return NextResponse.json({ error: 'No linked exhibitor record' }, { status: 404 })

      const rows = await db
        .select({
          ...eventFields,
          exhibitor_status: event_exhibitors.status,
          package_type: event_exhibitors.package_type,
        })
        .from(event_exhibitors)
        .innerJoin(events, eq(event_exhibitors.event_id, events.id))
        .where(eq(event_exhibitors.exhibitor_id, exhibitorRecord[0].id))

      return NextResponse.json({ data: rows })
    }

    return NextResponse.json({ error: 'Unknown role' }, { status: 400 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
