import { NextRequest } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { events, tasks, users } from '@/db/schema'
import { timesheets } from '@/db/schema-extensions'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { toCSV, csvResponse } from '@/lib/export'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return new Response('Unauthorized', { status: 401 })

    const params = req.nextUrl.searchParams
    const userId = params.get('user_id')
    const dateFrom = params.get('date_from')
    const dateTo = params.get('date_to')

    const canExportAll = hasPermission(session, 'timesheets', 'approve')
    const targetUserId = userId ? Number(userId) : null

    // Users can only export their own unless they have timesheets:approve
    if (targetUserId && targetUserId !== session.id && !canExportAll) {
      return new Response('Forbidden', { status: 403 })
    }

    const tsUser = db
      .select({
        id: users.id,
        full_name: sql<string>`${users.first_name} || ' ' || ${users.last_name}`,
      })
      .from(users)
      .as('ts_user')

    const conditions = []

    if (targetUserId) {
      conditions.push(eq(timesheets.user_id, targetUserId))
    } else if (!canExportAll) {
      // Non-admin users can only see their own
      conditions.push(eq(timesheets.user_id, session.id))
    }

    if (dateFrom) {
      conditions.push(gte(timesheets.date, new Date(dateFrom)))
    }
    if (dateTo) {
      conditions.push(lte(timesheets.date, new Date(dateTo)))
    }

    let query = db
      .select({
        date: timesheets.date,
        user_name: tsUser.full_name,
        event_title: events.title,
        task_title: tasks.title,
        hours: timesheets.hours,
        description: timesheets.description,
        billable: timesheets.billable,
        status: timesheets.status,
      })
      .from(timesheets)
      .leftJoin(tsUser, eq(timesheets.user_id, tsUser.id))
      .leftJoin(events, eq(timesheets.event_id, events.id))
      .leftJoin(tasks, eq(timesheets.task_id, tasks.id))
      .$dynamic()

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    const rows = await query

    const headers = [
      'Date', 'User', 'Event', 'Task', 'Hours',
      'Description', 'Billable', 'Status',
    ]

    const csvRows = rows.map((r) => [
      r.date ? r.date.toISOString().split('T')[0] : null,
      r.user_name,
      r.event_title,
      r.task_title,
      r.hours != null ? (r.hours / 60).toFixed(2) : null,
      r.description,
      r.billable ? 'Yes' : 'No',
      r.status,
    ])

    const today = new Date().toISOString().split('T')[0]
    return csvResponse(toCSV(headers, csvRows), `teems_timesheets_${today}.csv`)
  } catch {
    return new Response('Internal Server Error', { status: 500 })
  }
}
