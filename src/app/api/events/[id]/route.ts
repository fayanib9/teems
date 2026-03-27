import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { events, event_types, clients, users, tasks, event_vendors, event_speakers, event_exhibitors, documents, milestones } from '@/db/schema'
import { eq, and, count, sql } from 'drizzle-orm'
import { slugify } from '@/lib/utils'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session, 'events', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      slug: events.slug,
      description: events.description,
      status: events.status,
      priority: events.priority,
      start_date: events.start_date,
      end_date: events.end_date,
      timezone: events.timezone,
      venue_name: events.venue_name,
      venue_address: events.venue_address,
      venue_city: events.venue_city,
      venue_country: events.venue_country,
      expected_attendees: events.expected_attendees,
      actual_attendees: events.actual_attendees,
      budget_estimated: events.budget_estimated,
      budget_actual: events.budget_actual,
      currency: events.currency,
      notes: events.notes,
      cover_image_path: events.cover_image_path,
      created_by: events.created_by,
      created_at: events.created_at,
      updated_at: events.updated_at,
      event_type_id: events.event_type_id,
      client_id: events.client_id,
      event_type_name: event_types.name,
      event_type_color: event_types.color,
      event_type_icon: event_types.icon,
      client_name: clients.name,
    })
    .from(events)
    .leftJoin(event_types, eq(events.event_type_id, event_types.id))
    .leftJoin(clients, eq(events.client_id, clients.id))
    .where(eq(events.id, parseInt(id)))
    .limit(1)

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // Get counts for overview
  const [taskCount] = await db.select({ count: count() }).from(tasks).where(eq(tasks.event_id, event.id))
  const [vendorCount] = await db.select({ count: count() }).from(event_vendors).where(eq(event_vendors.event_id, event.id))
  const [speakerCount] = await db.select({ count: count() }).from(event_speakers).where(eq(event_speakers.event_id, event.id))
  const [exhibitorCount] = await db.select({ count: count() }).from(event_exhibitors).where(eq(event_exhibitors.event_id, event.id))
  const [documentCount] = await db.select({ count: count() }).from(documents).where(eq(documents.event_id, event.id))
  const [milestoneCount] = await db.select({ count: count() }).from(milestones).where(eq(milestones.event_id, event.id))

  return NextResponse.json({
    data: {
      ...event,
      _counts: {
        tasks: taskCount.count,
        vendors: vendorCount.count,
        speakers: speakerCount.count,
        exhibitors: exhibitorCount.count,
        documents: documentCount.count,
        milestones: milestoneCount.count,
      },
    },
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session, 'events', 'edit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const updateData: Record<string, unknown> = { updated_by: session.id, updated_at: new Date() }

  const allowedFields = [
    'title', 'description', 'event_type_id', 'client_id', 'status', 'priority',
    'start_date', 'end_date', 'venue_name', 'venue_address', 'venue_city', 'venue_country',
    'expected_attendees', 'actual_attendees', 'budget_estimated', 'budget_actual',
    'notes', 'cover_image_path',
  ]

  for (const field of allowedFields) {
    if (field in body) {
      if (field === 'start_date' || field === 'end_date') {
        updateData[field] = new Date(body[field])
      } else {
        updateData[field] = body[field]
      }
    }
  }

  // If title changed, update slug
  if (body.title) {
    let slug = slugify(body.title)
    const existing = await db.select({ id: events.id }).from(events)
      .where(and(eq(events.slug, slug), sql`${events.id} != ${parseInt(id)}`))
      .limit(1)
    if (existing.length > 0) slug = `${slug}-${Date.now()}`
    updateData.slug = slug
  }

  const [updated] = await db
    .update(events)
    .set(updateData)
    .where(eq(events.id, parseInt(id)))
    .returning()

  if (!updated) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session, 'events', 'delete')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const [deleted] = await db
    .delete(events)
    .where(eq(events.id, parseInt(id)))
    .returning({ id: events.id })

  if (!deleted) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
