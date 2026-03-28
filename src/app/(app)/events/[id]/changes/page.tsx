import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { change_requests, users, events } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { ChangesClient } from './changes-client'

export default async function ChangesPage({ params }: { params: Promise<{ id: string }> }) {
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

  const changes = await db
    .select({
      id: change_requests.id,
      title: change_requests.title,
      description: change_requests.description,
      change_type: change_requests.change_type,
      impact_assessment: change_requests.impact_assessment,
      status: change_requests.status,
      requested_by: change_requests.requested_by,
      approved_by: change_requests.approved_by,
      approved_at: change_requests.approved_at,
      created_at: change_requests.created_at,
      requester_first_name: users.first_name,
      requester_last_name: users.last_name,
    })
    .from(change_requests)
    .leftJoin(users, eq(change_requests.requested_by, users.id))
    .where(eq(change_requests.event_id, eventId))
    .orderBy(desc(change_requests.created_at))

  const canManage = hasPermission(session, 'events', 'edit')

  return (
    <ChangesClient
      eventId={eventId}
      eventTitle={event.title}
      changes={changes}
      canManage={canManage}
    />
  )
}
