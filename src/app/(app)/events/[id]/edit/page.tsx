import { getSession, hasPermission } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/db'
import { events, event_types, clients } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { EventForm } from '../../event-form'

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return null
  if (!hasPermission(session, 'events', 'edit')) redirect('/events')

  const { id } = await params
  const eventId = parseInt(id)
  if (isNaN(eventId)) notFound()

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1)
  if (!event) notFound()

  const types = await db.select().from(event_types).where(eq(event_types.is_active, true))
  const clientList = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.is_active, true))
    .orderBy(clients.name)

  // Format dates for datetime-local inputs
  function toLocalISO(d: Date | null): string {
    if (!d) return ''
    const date = new Date(d)
    const offset = date.getTimezoneOffset()
    const local = new Date(date.getTime() - offset * 60000)
    return local.toISOString().slice(0, 16)
  }

  return (
    <EventForm
      eventTypes={types}
      clients={clientList}
      initialData={{
        id: event.id,
        title: event.title,
        description: event.description || '',
        event_type_id: event.event_type_id ? String(event.event_type_id) : '',
        client_id: event.client_id ? String(event.client_id) : '',
        status: event.status,
        priority: event.priority || 'medium',
        start_date: toLocalISO(event.start_date),
        end_date: toLocalISO(event.end_date),
        venue_name: event.venue_name || '',
        venue_address: event.venue_address || '',
        venue_city: event.venue_city || '',
        venue_country: event.venue_country || '',
        expected_attendees: event.expected_attendees ? String(event.expected_attendees) : '',
        budget_estimated: event.budget_estimated ? String(Math.round(event.budget_estimated / 100)) : '',
        notes: event.notes || '',
      }}
    />
  )
}
