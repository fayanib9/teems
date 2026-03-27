import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { speakers, event_speakers, sessions, events } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role_name !== 'speaker') {
      return NextResponse.json({ error: 'Forbidden — speaker role required' }, { status: 403 })
    }

    const speakerRecord = await db
      .select({ id: speakers.id })
      .from(speakers)
      .where(eq(speakers.user_id, session.id))
      .limit(1)

    if (!speakerRecord[0]) return NextResponse.json({ error: 'No linked speaker record' }, { status: 404 })

    const rows = await db
      .select({
        assignment_id: event_speakers.id,
        event_id: event_speakers.event_id,
        session_id: event_speakers.session_id,
        role: event_speakers.role,
        status: event_speakers.status,
        fee: event_speakers.fee,
        event_title: events.title,
        event_status: events.status,
        event_start_date: events.start_date,
        event_end_date: events.end_date,
        event_venue_name: events.venue_name,
        event_venue_city: events.venue_city,
        session_title: sessions.title,
        session_description: sessions.description,
        session_type: sessions.session_type,
        session_date: sessions.date,
        session_start_time: sessions.start_time,
        session_end_time: sessions.end_time,
        session_location: sessions.location,
        session_capacity: sessions.capacity,
        session_status: sessions.status,
      })
      .from(event_speakers)
      .innerJoin(events, eq(event_speakers.event_id, events.id))
      .leftJoin(sessions, eq(event_speakers.session_id, sessions.id))
      .where(eq(event_speakers.speaker_id, speakerRecord[0].id))

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
