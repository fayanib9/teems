import { NextRequest } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { tasks, events, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { toCSV, csvResponse } from '@/lib/export'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return new Response('Unauthorized', { status: 401 })
    if (!hasPermission(session, 'tasks', 'view')) {
      return new Response('Forbidden', { status: 403 })
    }

    const eventId = req.nextUrl.searchParams.get('event_id')

    const assignee = db
      .select({
        id: users.id,
        full_name: sql<string>`${users.first_name} || ' ' || ${users.last_name}`,
      })
      .from(users)
      .as('assignee')

    let query = db
      .select({
        id: tasks.id,
        title: tasks.title,
        event_title: events.title,
        status: tasks.status,
        priority: tasks.priority,
        assigned_to_name: assignee.full_name,
        start_date: tasks.start_date,
        due_date: tasks.due_date,
        completed_at: tasks.completed_at,
      })
      .from(tasks)
      .innerJoin(events, eq(tasks.event_id, events.id))
      .leftJoin(assignee, eq(tasks.assigned_to, assignee.id))
      .$dynamic()

    if (eventId) {
      query = query.where(eq(tasks.event_id, Number(eventId)))
    }

    const rows = await query

    const headers = [
      'ID', 'Title', 'Event', 'Status', 'Priority',
      'Assigned To', 'Start Date', 'Due Date', 'Completed At',
    ]

    const csvRows = rows.map((r) => [
      r.id,
      r.title,
      r.event_title,
      r.status,
      r.priority,
      r.assigned_to_name,
      r.start_date ? r.start_date.toISOString().split('T')[0] : null,
      r.due_date ? r.due_date.toISOString().split('T')[0] : null,
      r.completed_at ? r.completed_at.toISOString().split('T')[0] : null,
    ])

    const today = new Date().toISOString().split('T')[0]
    return csvResponse(toCSV(headers, csvRows), `teems_tasks_${today}.csv`)
  } catch {
    return new Response('Internal Server Error', { status: 500 })
  }
}
