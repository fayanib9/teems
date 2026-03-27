import { getSession, hasPermission } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { events, tasks, clients, vendors, speakers, exhibitors, documents, approvals } from '@/db/schema'
import { count, eq, sql, and } from 'drizzle-orm'
import { ReportsClient } from './reports-client'

export default async function ReportsPage() {
  const session = await getSession()
  if (!session) return null
  if (!hasPermission(session, 'reports', 'view')) redirect('/dashboard')

  // Summary counts
  const [eventCount] = await db.select({ count: count() }).from(events)
  const [taskCount] = await db.select({ count: count() }).from(tasks)
  const [taskDone] = await db.select({ count: count() }).from(tasks).where(eq(tasks.status, 'done'))
  const [clientCount] = await db.select({ count: count() }).from(clients).where(eq(clients.is_active, true))
  const [vendorCount] = await db.select({ count: count() }).from(vendors).where(eq(vendors.is_active, true))
  const [speakerCount] = await db.select({ count: count() }).from(speakers).where(eq(speakers.is_active, true))
  const [exhibitorCount] = await db.select({ count: count() }).from(exhibitors).where(eq(exhibitors.is_active, true))
  const [docCount] = await db.select({ count: count() }).from(documents).where(eq(documents.is_archived, false))
  const [approvalCount] = await db.select({ count: count() }).from(approvals)

  // Event status breakdown
  const eventStatuses = await db
    .select({ status: events.status, count: count() })
    .from(events)
    .groupBy(events.status)

  // Task status breakdown
  const taskStatuses = await db
    .select({ status: tasks.status, count: count() })
    .from(tasks)
    .groupBy(tasks.status)

  // Task priority breakdown
  const taskPriorities = await db
    .select({ priority: tasks.priority, count: count() })
    .from(tasks)
    .groupBy(tasks.priority)

  // Approval status breakdown
  const approvalStatuses = await db
    .select({ status: approvals.status, count: count() })
    .from(approvals)
    .groupBy(approvals.status)

  // Events by month (last 6 months)
  const eventsByMonth = await db
    .select({
      month: sql<string>`to_char(${events.start_date}, 'YYYY-MM')`,
      count: count(),
    })
    .from(events)
    .where(sql`${events.start_date} >= NOW() - INTERVAL '6 months'`)
    .groupBy(sql`to_char(${events.start_date}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${events.start_date}, 'YYYY-MM')`)

  return (
    <ReportsClient
      summary={{
        events: eventCount.count,
        tasks: taskCount.count,
        tasksDone: taskDone.count,
        clients: clientCount.count,
        vendors: vendorCount.count,
        speakers: speakerCount.count,
        exhibitors: exhibitorCount.count,
        documents: docCount.count,
        approvals: approvalCount.count,
      }}
      eventStatuses={eventStatuses.map(r => ({ status: r.status || 'unknown', count: r.count }))}
      taskStatuses={taskStatuses.map(r => ({ status: r.status || 'unknown', count: r.count }))}
      taskPriorities={taskPriorities.map(r => ({ priority: r.priority || 'unknown', count: r.count }))}
      approvalStatuses={approvalStatuses.map(r => ({ status: r.status || 'unknown', count: r.count }))}
      eventsByMonth={eventsByMonth.map(r => ({ month: r.month, count: r.count }))}
    />
  )
}
