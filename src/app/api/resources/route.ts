import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { users, tasks, events, event_assignments, roles } from '@/db/schema'
import { eq, and, sql, ne, count } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get all active internal users
    const allUsers = await db
      .select({
        id: users.id,
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
        role_name: roles.display_name,
      })
      .from(users)
      .leftJoin(roles, eq(users.role_id, roles.id))
      .where(and(eq(users.is_active, true), eq(users.user_type, 'internal')))

    // Get task counts per user (active tasks only)
    const taskCounts = await db
      .select({
        assigned_to: tasks.assigned_to,
        total: count(),
        active: sql<number>`count(*) filter (where ${tasks.status} not in ('done', 'cancelled'))`,
        done: sql<number>`count(*) filter (where ${tasks.status} = 'done')`,
      })
      .from(tasks)
      .where(sql`${tasks.assigned_to} is not null`)
      .groupBy(tasks.assigned_to)

    const taskMap = new Map(taskCounts.map(t => [t.assigned_to!, t]))

    // Get event assignment counts per user
    const eventCounts = await db
      .select({
        user_id: event_assignments.user_id,
        event_count: count(),
      })
      .from(event_assignments)
      .groupBy(event_assignments.user_id)

    const eventMap = new Map(eventCounts.map(e => [e.user_id, e.event_count]))

    const url = req.nextUrl.searchParams
    const userId = url.get('user_id')

    // If requesting specific user's assignments
    if (userId) {
      const uid = parseInt(userId)
      const assignments = await db
        .select({
          task_id: tasks.id,
          task_title: tasks.title,
          task_status: tasks.status,
          task_priority: tasks.priority,
          task_due_date: tasks.due_date,
          event_id: tasks.event_id,
          event_title: events.title,
        })
        .from(tasks)
        .leftJoin(events, eq(tasks.event_id, events.id))
        .where(eq(tasks.assigned_to, uid))

      return NextResponse.json({ data: assignments })
    }

    const resources = allUsers.map(user => {
      const tc = taskMap.get(user.id) || { total: 0, active: 0, done: 0 }
      const eventCount = eventMap.get(user.id) || 0
      const activeTasks = Number(tc.active)

      let workload: 'green' | 'amber' | 'red' = 'green'
      if (activeTasks > 10) workload = 'red'
      else if (activeTasks >= 5) workload = 'amber'

      return {
        ...user,
        event_count: eventCount,
        task_total: Number(tc.total),
        task_active: activeTasks,
        task_done: Number(tc.done),
        workload,
      }
    })

    return NextResponse.json({ data: resources })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
