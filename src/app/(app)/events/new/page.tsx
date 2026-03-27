import { getSession, hasPermission } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { event_types, clients } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { EventForm } from '../event-form'

export default async function NewEventPage() {
  const session = await getSession()
  if (!session) return null
  if (!hasPermission(session, 'events', 'create')) redirect('/events')

  const types = await db.select().from(event_types).where(eq(event_types.is_active, true))
  const clientList = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.is_active, true))
    .orderBy(clients.name)

  return (
    <EventForm
      eventTypes={types}
      clients={clientList}
    />
  )
}
