import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import {
  clients, events, vendors, event_vendors, speakers, event_speakers,
  exhibitors, event_exhibitors, documents,
} from '@/db/schema'
import { eq, inArray, desc } from 'drizzle-orm'

const EXTERNAL_ROLES = ['client', 'vendor', 'speaker', 'exhibitor']

async function getEventIdsForUser(sessionId: number, roleName: string): Promise<number[]> {
  if (roleName === 'client') {
    const clientRecord = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.user_id, sessionId))
      .limit(1)
    if (!clientRecord[0]) return []
    const rows = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.client_id, clientRecord[0].id))
    return rows.map(r => r.id)
  }

  if (roleName === 'vendor') {
    const vendorRecord = await db
      .select({ id: vendors.id })
      .from(vendors)
      .where(eq(vendors.user_id, sessionId))
      .limit(1)
    if (!vendorRecord[0]) return []
    const rows = await db
      .select({ event_id: event_vendors.event_id })
      .from(event_vendors)
      .where(eq(event_vendors.vendor_id, vendorRecord[0].id))
    return rows.map(r => r.event_id)
  }

  if (roleName === 'speaker') {
    const speakerRecord = await db
      .select({ id: speakers.id })
      .from(speakers)
      .where(eq(speakers.user_id, sessionId))
      .limit(1)
    if (!speakerRecord[0]) return []
    const rows = await db
      .select({ event_id: event_speakers.event_id })
      .from(event_speakers)
      .where(eq(event_speakers.speaker_id, speakerRecord[0].id))
    return rows.map(r => r.event_id)
  }

  if (roleName === 'exhibitor') {
    const exhibitorRecord = await db
      .select({ id: exhibitors.id })
      .from(exhibitors)
      .where(eq(exhibitors.user_id, sessionId))
      .limit(1)
    if (!exhibitorRecord[0]) return []
    const rows = await db
      .select({ event_id: event_exhibitors.event_id })
      .from(event_exhibitors)
      .where(eq(event_exhibitors.exhibitor_id, exhibitorRecord[0].id))
    return rows.map(r => r.event_id)
  }

  return []
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!EXTERNAL_ROLES.includes(session.role_name)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const eventIds = await getEventIdsForUser(session.id, session.role_name)
    if (eventIds.length === 0) return NextResponse.json({ data: [] })

    const rows = await db
      .select({
        id: documents.id,
        event_id: documents.event_id,
        title: documents.title,
        description: documents.description,
        file_name: documents.file_name,
        file_size: documents.file_size,
        mime_type: documents.mime_type,
        category: documents.category,
        version: documents.version,
        created_at: documents.created_at,
        event_title: events.title,
      })
      .from(documents)
      .leftJoin(events, eq(documents.event_id, events.id))
      .where(inArray(documents.event_id, eventIds))
      .orderBy(desc(documents.created_at))

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
