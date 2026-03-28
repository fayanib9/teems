import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { vendor_ratings } from '@/db/schema-extensions'
import { event_vendors, vendors } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = Number(id)

    const rows = await db
      .select({
        id: vendor_ratings.id,
        event_vendor_id: vendor_ratings.event_vendor_id,
        event_id: vendor_ratings.event_id,
        vendor_id: vendor_ratings.vendor_id,
        quality_rating: vendor_ratings.quality_rating,
        timeliness_rating: vendor_ratings.timeliness_rating,
        communication_rating: vendor_ratings.communication_rating,
        value_rating: vendor_ratings.value_rating,
        overall_rating: vendor_ratings.overall_rating,
        comments: vendor_ratings.comments,
        would_rehire: vendor_ratings.would_rehire,
        rated_by: vendor_ratings.rated_by,
        rated_at: vendor_ratings.rated_at,
        vendor_name: vendors.name,
        vendor_category: vendors.category,
        service_description: event_vendors.service_description,
      })
      .from(vendor_ratings)
      .innerJoin(event_vendors, eq(vendor_ratings.event_vendor_id, event_vendors.id))
      .innerJoin(vendors, eq(vendor_ratings.vendor_id, vendors.id))
      .where(eq(vendor_ratings.event_id, eventId))
      .orderBy(vendors.name)

    return NextResponse.json({
      data: rows,
      meta: { count: rows.length },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const eventId = Number(id)
    const body = await req.json()
    const { event_vendor_id, quality_rating, timeliness_rating, communication_rating, value_rating, overall_rating, comments, would_rehire } = body

    if (!event_vendor_id) return NextResponse.json({ error: 'Event vendor ID required' }, { status: 400 })
    if (!overall_rating) return NextResponse.json({ error: 'Overall rating required' }, { status: 400 })

    // Validate ratings are 1-5
    const ratings = { quality_rating, timeliness_rating, communication_rating, value_rating, overall_rating }
    for (const [key, val] of Object.entries(ratings)) {
      if (val !== undefined && val !== null && (Number(val) < 1 || Number(val) > 5)) {
        return NextResponse.json({ error: `${key} must be between 1 and 5` }, { status: 400 })
      }
    }

    // Verify event_vendor belongs to this event
    const [eventVendor] = await db
      .select()
      .from(event_vendors)
      .where(and(eq(event_vendors.id, Number(event_vendor_id)), eq(event_vendors.event_id, eventId)))

    if (!eventVendor) return NextResponse.json({ error: 'Vendor not assigned to this event' }, { status: 404 })

    const [row] = await db.insert(vendor_ratings).values({
      event_vendor_id: eventVendor.id,
      event_id: eventId,
      vendor_id: eventVendor.vendor_id,
      quality_rating: quality_rating ? Number(quality_rating) : null,
      timeliness_rating: timeliness_rating ? Number(timeliness_rating) : null,
      communication_rating: communication_rating ? Number(communication_rating) : null,
      value_rating: value_rating ? Number(value_rating) : null,
      overall_rating: Number(overall_rating),
      comments: comments || null,
      would_rehire: would_rehire ?? null,
      rated_by: session.id,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    // Handle unique constraint violation (one rating per event_vendor per user)
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json({ error: 'You have already rated this vendor for this event' }, { status: 409 })
    }
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
