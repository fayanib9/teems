import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { events, tasks, event_assignments, users, raci_assignments } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { RaciClient } from './raci-client'

export default async function RaciPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return null

  const { id } = await params
  const eventId = parseInt(id)
  if (isNaN(eventId)) notFound()

  const [event] = await db
    .select({ id: events.id, title: events.title })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1)

  if (!event) notFound()

  const eventTasks = await db
    .select({ id: tasks.id, title: tasks.title })
    .from(tasks)
    .where(eq(tasks.event_id, eventId))

  const teamMembers = await db
    .select({
      user_id: event_assignments.user_id,
      first_name: users.first_name,
      last_name: users.last_name,
    })
    .from(event_assignments)
    .innerJoin(users, eq(event_assignments.user_id, users.id))
    .where(eq(event_assignments.event_id, eventId))

  const raciRows = await db
    .select({
      id: raci_assignments.id,
      task_id: raci_assignments.task_id,
      user_id: raci_assignments.user_id,
      raci_type: raci_assignments.raci_type,
    })
    .from(raci_assignments)
    .where(eq(raci_assignments.event_id, eventId))

  return (
    <RaciClient
      eventId={eventId}
      eventTitle={event.title}
      tasks={eventTasks}
      members={teamMembers}
      assignments={raciRows}
    />
  )
}
