import { NextRequest } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { attendees } from '@/db/schema-extensions'
import { eq } from 'drizzle-orm'
import { toCSV, csvResponse } from '@/lib/export'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return new Response('Unauthorized', { status: 401 })
    if (!hasPermission(session, 'events', 'export')) {
      return new Response('Forbidden', { status: 403 })
    }

    const eventId = req.nextUrl.searchParams.get('event_id')
    if (!eventId) {
      return new Response('event_id is required', { status: 400 })
    }

    const rows = await db
      .select({
        first_name: attendees.first_name,
        last_name: attendees.last_name,
        email: attendees.email,
        phone: attendees.phone,
        organization: attendees.organization,
        registration_type: attendees.registration_type,
        status: attendees.status,
        registered_at: attendees.registered_at,
        checked_in_at: attendees.checked_in_at,
      })
      .from(attendees)
      .where(eq(attendees.event_id, Number(eventId)))

    const headers = [
      'First Name', 'Last Name', 'Email', 'Phone', 'Organization',
      'Type', 'Status', 'Registration Date', 'Checked In At',
    ]

    const csvRows = rows.map((r) => [
      r.first_name,
      r.last_name,
      r.email,
      r.phone,
      r.organization,
      r.registration_type,
      r.status,
      r.registered_at ? r.registered_at.toISOString().split('T')[0] : null,
      r.checked_in_at ? r.checked_in_at.toISOString() : null,
    ])

    const today = new Date().toISOString().split('T')[0]
    return csvResponse(toCSV(headers, csvRows), `teems_attendees_${eventId}_${today}.csv`)
  } catch {
    return new Response('Internal Server Error', { status: 500 })
  }
}
