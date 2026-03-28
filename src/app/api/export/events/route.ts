import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { events, event_types, clients } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { toCSV, csvResponse } from '@/lib/export'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return new Response('Unauthorized', { status: 401 })
    if (!hasPermission(session, 'events', 'export')) {
      return new Response('Forbidden', { status: 403 })
    }

    const rows = await db
      .select({
        id: events.id,
        title: events.title,
        type_name: event_types.name,
        client_name: clients.name,
        status: events.status,
        start_date: events.start_date,
        end_date: events.end_date,
        venue_name: events.venue_name,
        budget_estimated: events.budget_estimated,
        budget_actual: events.budget_actual,
      })
      .from(events)
      .leftJoin(event_types, eq(events.event_type_id, event_types.id))
      .leftJoin(clients, eq(events.client_id, clients.id))

    const headers = [
      'ID', 'Title', 'Type', 'Client', 'Status',
      'Start Date', 'End Date', 'Venue', 'Budget (SAR)', 'Actual Cost (SAR)',
    ]

    const csvRows = rows.map((r) => [
      r.id,
      r.title,
      r.type_name,
      r.client_name,
      r.status,
      r.start_date ? r.start_date.toISOString().split('T')[0] : null,
      r.end_date ? r.end_date.toISOString().split('T')[0] : null,
      r.venue_name,
      r.budget_estimated != null ? (r.budget_estimated / 100).toFixed(2) : null,
      r.budget_actual != null ? (r.budget_actual / 100).toFixed(2) : null,
    ])

    const today = new Date().toISOString().split('T')[0]
    return csvResponse(toCSV(headers, csvRows), `teems_events_${today}.csv`)
  } catch {
    return new Response('Internal Server Error', { status: 500 })
  }
}
