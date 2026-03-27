import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { exhibitors, event_exhibitors, booths, events } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role_name !== 'exhibitor') {
      return NextResponse.json({ error: 'Forbidden — exhibitor role required' }, { status: 403 })
    }

    const exhibitorRecord = await db
      .select({ id: exhibitors.id })
      .from(exhibitors)
      .where(eq(exhibitors.user_id, session.id))
      .limit(1)

    if (!exhibitorRecord[0]) return NextResponse.json({ error: 'No linked exhibitor record' }, { status: 404 })

    const rows = await db
      .select({
        assignment_id: event_exhibitors.id,
        event_id: event_exhibitors.event_id,
        booth_id: event_exhibitors.booth_id,
        package_type: event_exhibitors.package_type,
        contract_amount: event_exhibitors.contract_amount,
        status: event_exhibitors.status,
        special_requirements: event_exhibitors.special_requirements,
        notes: event_exhibitors.notes,
        event_title: events.title,
        event_status: events.status,
        event_start_date: events.start_date,
        event_end_date: events.end_date,
        event_venue_name: events.venue_name,
        event_venue_city: events.venue_city,
        booth_number: booths.booth_number,
        booth_size: booths.size,
        booth_dimensions: booths.dimensions,
        booth_location_zone: booths.location_zone,
        booth_price: booths.price,
        booth_amenities: booths.amenities,
        booth_status: booths.status,
      })
      .from(event_exhibitors)
      .innerJoin(events, eq(event_exhibitors.event_id, events.id))
      .leftJoin(booths, eq(event_exhibitors.booth_id, booths.id))
      .where(eq(event_exhibitors.exhibitor_id, exhibitorRecord[0].id))

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
