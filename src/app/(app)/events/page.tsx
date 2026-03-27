import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { events, event_types, clients } from '@/db/schema'
import { eq, and, ilike, or, desc, asc, count } from 'drizzle-orm'
import { PageHeader } from '@/components/layout/page-header'
import { EventsListClient } from './events-list-client'

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const session = await getSession()
  if (!session) return null

  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 20
  const status = params.status
  const search = params.search
  const typeId = params.type_id
  const sort = params.sort || 'created_at'
  const order = params.order || 'desc'

  const conditions = []
  if (status) conditions.push(eq(events.status, status))
  if (typeId) conditions.push(eq(events.event_type_id, parseInt(typeId)))
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
      status: events.status,
      priority: events.priority,
      start_date: events.start_date,
      end_date: events.end_date,
      venue_name: events.venue_name,
      venue_city: events.venue_city,
      expected_attendees: events.expected_attendees,
      budget_estimated: events.budget_estimated,
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

  const types = await db.select().from(event_types).where(eq(event_types.is_active, true))

  const canCreate = hasPermission(session, 'events', 'create')

  return (
    <EventsListClient
      events={rows}
      eventTypes={types}
      pagination={{
        page,
        limit,
        total: totalResult.count,
        pages: Math.ceil(totalResult.count / limit),
      }}
      filters={{ status, search, type_id: typeId, sort, order }}
      canCreate={canCreate}
    />
  )
}
