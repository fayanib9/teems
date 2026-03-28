import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { events, tasks, approvals, clients, generated_plans, event_assignments } from '@/db/schema'
import { eq, and, sql, count, desc } from 'drizzle-orm'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return null

  const [eventStats] = await db
    .select({ count: count() })
    .from(events)
    .where(eq(events.status, 'in_progress'))

  const [taskStats] = await db
    .select({ count: count() })
    .from(tasks)
    .where(eq(tasks.assigned_to, session.id))

  const [tasksDue] = await db
    .select({ count: count() })
    .from(tasks)
    .where(
      and(
        eq(tasks.assigned_to, session.id),
        eq(tasks.status, 'todo'),
        sql`${tasks.due_date} <= NOW() + INTERVAL '3 days'`
      )
    )

  const [pendingApprovals] = await db
    .select({ count: count() })
    .from(approvals)
    .where(eq(approvals.status, 'pending'))

  const [totalEvents] = await db
    .select({ count: count() })
    .from(events)

  // Recent events (last 5)
  const recentEvents = await db
    .select({
      id: events.id,
      title: events.title,
      status: events.status,
      start_date: events.start_date,
      venue_name: events.venue_name,
    })
    .from(events)
    .orderBy(desc(events.created_at))
    .limit(5)

  // My tasks due this week
  const myTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      due_date: tasks.due_date,
      event_id: tasks.event_id,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.assigned_to, session.id),
        sql`${tasks.status} != 'done'`,
        sql`${tasks.status} != 'cancelled'`,
        sql`${tasks.due_date} <= NOW() + INTERVAL '7 days'`
      )
    )
    .orderBy(tasks.due_date)
    .limit(5)

  // Upcoming deadlines (tasks due in next 7 days, any user)
  const upcomingDeadlines = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      due_date: tasks.due_date,
      event_id: tasks.event_id,
    })
    .from(tasks)
    .where(
      and(
        sql`${tasks.status} != 'done'`,
        sql`${tasks.status} != 'cancelled'`,
        sql`${tasks.due_date} >= NOW()`,
        sql`${tasks.due_date} <= NOW() + INTERVAL '7 days'`
      )
    )
    .orderBy(tasks.due_date)
    .limit(5)

  const isExecutive = ['super_admin', 'admin', 'executive'].includes(session.role_name)

  // Onboarding checks
  const [clientCount] = await db.select({ count: count() }).from(clients)
  const [planCount] = await db.select({ count: count() }).from(generated_plans)
  const [assignmentCount] = await db.select({ count: count() }).from(event_assignments)

  return (
    <DashboardClient
      onboarding={{
        hasClients: clientCount.count > 0,
        hasEvents: totalEvents.count > 0,
        hasPlans: planCount.count > 0,
        hasTeamAssignments: assignmentCount.count > 0,
      }}
      user={{ first_name: session.first_name }}
      isExecutive={isExecutive}
      stats={{
        activeEvents: eventStats.count,
        myTasks: taskStats.count,
        dueSoon: tasksDue.count,
        pendingApprovals: pendingApprovals.count,
        totalEvents: totalEvents.count,
      }}
      recentEvents={recentEvents.map(e => ({
        id: e.id,
        title: e.title,
        status: e.status,
        start_date: e.start_date ? e.start_date.toISOString() : null,
        venue_name: e.venue_name,
      }))}
      myTasksList={myTasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status || 'todo',
        priority: t.priority || 'medium',
        due_date: t.due_date ? t.due_date.toISOString() : null,
        event_id: t.event_id,
      }))}
      upcomingDeadlines={upcomingDeadlines.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status || 'todo',
        priority: t.priority || 'medium',
        due_date: t.due_date ? t.due_date.toISOString() : null,
        event_id: t.event_id,
      }))}
    />
  )
}
