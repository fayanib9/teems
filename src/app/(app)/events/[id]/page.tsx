import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { events, event_types, clients, tasks, users, event_assignments } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
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

  // Get all counts in a single query (including setup checklist counts)
  const countsResult = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM tasks WHERE event_id = ${eventId}) as task_count,
      (SELECT COUNT(*) FROM tasks WHERE event_id = ${eventId} AND status = 'done') as task_done_count,
      (SELECT COUNT(*) FROM event_vendors WHERE event_id = ${eventId}) as vendor_count,
      (SELECT COUNT(*) FROM event_speakers WHERE event_id = ${eventId}) as speaker_count,
      (SELECT COUNT(*) FROM event_exhibitors WHERE event_id = ${eventId}) as exhibitor_count,
      (SELECT COUNT(*) FROM documents WHERE event_id = ${eventId}) as document_count,
      (SELECT COUNT(*) FROM milestones WHERE event_id = ${eventId}) as milestone_count,
      (SELECT COUNT(*) FROM event_assignments WHERE event_id = ${eventId}) as assignment_count,
      (SELECT COUNT(*) FROM budget_calculations WHERE event_id = ${eventId}) as budget_calc_count,
      (SELECT COUNT(*) FROM generated_plans WHERE event_id = ${eventId}) as plan_count,
      (SELECT COUNT(*) FROM risk_assessments WHERE event_id = ${eventId}) as risk_count,
      (SELECT COUNT(*) FROM change_requests WHERE event_id = ${eventId}) as change_count,
      (SELECT COUNT(*) FROM lessons_learned WHERE event_id = ${eventId}) as lesson_count
  `)
  const counts = countsResult.rows[0] as Record<string, string>

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
        tasks: Number(counts.task_count),
        tasksDone: Number(counts.task_done_count),
        vendors: Number(counts.vendor_count),
        speakers: Number(counts.speaker_count),
        exhibitors: Number(counts.exhibitor_count),
        documents: Number(counts.document_count),
        milestones: Number(counts.milestone_count),
        assignments: Number(counts.assignment_count),
        budgetCalcs: Number(counts.budget_calc_count),
        plans: Number(counts.plan_count),
        risks: Number(counts.risk_count),
        changes: Number(counts.change_count),
        lessons: Number(counts.lesson_count),
      }}
      recentTasks={recentTasks}
      teamMembers={teamMembers}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  )
}
