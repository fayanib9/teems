import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { events, event_types, clients, users } from '@/db/schema'
import { eq, and, ilike, sql, desc, asc, count, or } from 'drizzle-orm'
import { slugify } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session, 'events', 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = req.nextUrl.searchParams
  const page = parseInt(url.get('page') || '1')
  const limit = parseInt(url.get('limit') || '20')
  const status = url.get('status')
  const search = url.get('search')
  const type_id = url.get('type_id')
  const client_id = url.get('client_id')
  const sort = url.get('sort') || 'created_at'
  const order = url.get('order') || 'desc'

  const conditions = []
  if (status) conditions.push(eq(events.status, status))
  if (type_id) conditions.push(eq(events.event_type_id, parseInt(type_id)))
  if (client_id) conditions.push(eq(events.client_id, parseInt(client_id)))
  if (search) {
    conditions.push(
      or(
        ilike(events.title, `%${search}%`),
        ilike(events.venue_name, `%${search}%`)
      )
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [totalResult] = await db.select({ count: count() }).from(events).where(where)

  const sortColumn = sort === 'start_date' ? events.start_date
    : sort === 'title' ? events.title
    : sort === 'status' ? events.status
    : events.created_at
  const orderFn = order === 'asc' ? asc : desc

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      slug: events.slug,
      description: events.description,
      status: events.status,
      priority: events.priority,
      start_date: events.start_date,
      end_date: events.end_date,
      venue_name: events.venue_name,
      venue_city: events.venue_city,
      expected_attendees: events.expected_attendees,
      budget_estimated: events.budget_estimated,
      cover_image_path: events.cover_image_path,
      created_at: events.created_at,
      event_type_name: event_types.name,
      event_type_color: event_types.color,
      event_type_icon: event_types.icon,
      client_name: clients.name,
    })
    .from(events)
    .leftJoin(event_types, eq(events.event_type_id, event_types.id))
    .leftJoin(clients, eq(events.client_id, clients.id))
    .where(where)
    .orderBy(orderFn(sortColumn))
    .limit(limit)
    .offset((page - 1) * limit)

  return NextResponse.json({
    data: rows,
    pagination: {
      page,
      limit,
      total: totalResult.count,
      pages: Math.ceil(totalResult.count / limit),
    },
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session, 'events', 'create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { title, description, event_type_id, client_id, status: eventStatus, priority, start_date, end_date, venue_name, venue_address, venue_city, venue_country, expected_attendees, budget_estimated, notes } = body

  if (!title || !start_date || !end_date) {
    return NextResponse.json({ error: 'Title, start date, and end date are required' }, { status: 400 })
  }

  // Generate unique slug
  let slug = slugify(title)
  const existing = await db.select({ id: events.id }).from(events).where(eq(events.slug, slug)).limit(1)
  if (existing.length > 0) {
    slug = `${slug}-${Date.now()}`
  }

  const [event] = await db.insert(events).values({
    title,
    slug,
    description: description || null,
    event_type_id: event_type_id || null,
    client_id: client_id || null,
    status: eventStatus || 'draft',
    priority: priority || 'medium',
    start_date: new Date(start_date),
    end_date: new Date(end_date),
    venue_name: venue_name || null,
    venue_address: venue_address || null,
    venue_city: venue_city || null,
    venue_country: venue_country || null,
    expected_attendees: expected_attendees || null,
    budget_estimated: budget_estimated || null,
    notes: notes || null,
    created_by: session.id,
    updated_by: session.id,
  }).returning()

  return NextResponse.json({ data: event }, { status: 201 })
}
