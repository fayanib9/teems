import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { events, tasks, users } from '@/db/schema'
import { timesheets } from '@/db/schema-extensions'
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm'
import { TimesheetClient } from './timesheet-client'

export default async function TimesheetsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const session = await getSession()
  if (!session) return null

  const params = await searchParams

  // Determine the week to display
  // Default to current week (Monday-based)
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const defaultMonday = new Date(today)
  defaultMonday.setDate(today.getDate() + mondayOffset)
  defaultMonday.setHours(0, 0, 0, 0)

  const weekStart = params.week_start
    ? new Date(params.week_start)
    : defaultMonday

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  // Fetch timesheet entries for this week
  const entries = await db
    .select({
      id: timesheets.id,
      user_id: timesheets.user_id,
      event_id: timesheets.event_id,
      task_id: timesheets.task_id,
      date: timesheets.date,
      hours: timesheets.hours,
      description: timesheets.description,
      billable: timesheets.billable,
      status: timesheets.status,
      approved_by: timesheets.approved_by,
      approved_at: timesheets.approved_at,
      created_at: timesheets.created_at,
      event_title: events.title,
      task_title: tasks.title,
    })
    .from(timesheets)
    .leftJoin(events, eq(timesheets.event_id, events.id))
    .leftJoin(tasks, eq(timesheets.task_id, tasks.id))
    .where(
      and(
        eq(timesheets.user_id, session.id),
        gte(timesheets.date, weekStart),
        lte(timesheets.date, weekEnd),
      )
    )
    .orderBy(asc(timesheets.date))

  // Get list of events for dropdown
  const eventList = await db
    .select({ id: events.id, title: events.title })
    .from(events)
    .orderBy(desc(events.created_at))
    .limit(50)

  // Get tasks grouped by event
  const taskList = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      event_id: tasks.event_id,
    })
    .from(tasks)
    .orderBy(asc(tasks.title))

  // Serialize dates for client
  const serializedEntries = entries.map(e => ({
    ...e,
    date: e.date.toISOString(),
    approved_at: e.approved_at?.toISOString() || null,
    created_at: e.created_at?.toISOString() || null,
  }))

  return (
    <TimesheetClient
      entries={serializedEntries}
      events={eventList}
      tasks={taskList}
      weekStart={weekStart.toISOString()}
      currentUserId={session.id}
    />
  )
}
