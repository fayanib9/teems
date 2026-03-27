import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { events, event_types, clients, tasks, event_vendors, event_speakers, event_exhibitors, documents, milestones, users, event_assignments } from '@/db/schema'
import { eq, and, count, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { EventCommandCenter } from './command-center'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return null

  const { id } = await params
  const eventId = parseInt(id)
  if (isNaN(eventId)) notFound()

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
      event_type_id: events.event_type_id,
      client_id: events.client_id,
      created_by: events.created_by,
      created_at: events.created_at,
      updated_at: events.updated_at,
      event_type_name: event_types.name,
      event_type_color: event_types.color,
      event_type_icon: event_types.icon,
      client_name: clients.name,
    })
    .from(events)
    .leftJoin(event_types, eq(events.event_type_id, event_types.id))
    .leftJoin(clients, eq(events.client_id, clients.id))
    .where(eq(events.id, eventId))
    .limit(1)

  if (!event) notFound()

  // Get counts
  const [taskCount] = await db.select({ count: count() }).from(tasks).where(eq(tasks.event_id, eventId))
  const [taskDoneCount] = await db.select({ count: count() }).from(tasks).where(and(eq(tasks.event_id, eventId), eq(tasks.status, 'done')))
  const [vendorCount] = await db.select({ count: count() }).from(event_vendors).where(eq(event_vendors.event_id, eventId))
  const [speakerCount] = await db.select({ count: count() }).from(event_speakers).where(eq(event_speakers.event_id, eventId))
  const [exhibitorCount] = await db.select({ count: count() }).from(event_exhibitors).where(eq(event_exhibitors.event_id, eventId))
  const [documentCount] = await db.select({ count: count() }).from(documents).where(eq(documents.event_id, eventId))
  const [milestoneCount] = await db.select({ count: count() }).from(milestones).where(eq(milestones.event_id, eventId))

  // Recent tasks
  const recentTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      due_date: tasks.due_date,
      assigned_to: tasks.assigned_to,
      assigned_name: users.first_name,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigned_to, users.id))
    .where(eq(tasks.event_id, eventId))
    .orderBy(desc(tasks.created_at))
    .limit(5)

  // Team members
  const teamMembers = await db
    .select({
      id: event_assignments.id,
      user_id: event_assignments.user_id,
      role_in_event: event_assignments.role_in_event,
      first_name: users.first_name,
      last_name: users.last_name,
      email: users.email,
    })
    .from(event_assignments)
    .innerJoin(users, eq(event_assignments.user_id, users.id))
    .where(eq(event_assignments.event_id, eventId))

  const canEdit = hasPermission(session, 'events', 'edit')
  const canDelete = hasPermission(session, 'events', 'delete')

  return (
    <EventCommandCenter
      event={event}
      counts={{
        tasks: taskCount.count,
        tasksDone: taskDoneCount.count,
        vendors: vendorCount.count,
        speakers: speakerCount.count,
        exhibitors: exhibitorCount.count,
        documents: documentCount.count,
        milestones: milestoneCount.count,
      }}
      recentTasks={recentTasks}
      teamMembers={teamMembers}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  )
}
