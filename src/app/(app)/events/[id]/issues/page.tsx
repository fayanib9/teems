import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { events, event_issues, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { IssuesClient } from './issues-client'

export default async function IssuesPage({ params }: { params: Promise<{ id: string }> }) {
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

  const issues = await db
    .select({
      id: event_issues.id,
      title: event_issues.title,
      description: event_issues.description,
      severity: event_issues.severity,
      status: event_issues.status,
      reported_by: event_issues.reported_by,
      assigned_to: event_issues.assigned_to,
      resolution: event_issues.resolution,
      resolved_at: event_issues.resolved_at,
      created_at: event_issues.created_at,
    })
    .from(event_issues)
    .where(eq(event_issues.event_id, eventId))
    .orderBy(desc(event_issues.created_at))

  const allUsers = await db
    .select({ id: users.id, first_name: users.first_name, last_name: users.last_name })
    .from(users)
    .where(eq(users.is_active, true))

  return (
    <IssuesClient
      eventId={eventId}
      eventTitle={event.title}
      initialIssues={issues}
      users={allUsers}
    />
  )
}
