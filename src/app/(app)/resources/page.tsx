import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { users, tasks, event_assignments, roles } from '@/db/schema'
import { eq, and, sql, count } from 'drizzle-orm'
import { ResourcesClient } from './resources-client'

export default async function ResourcesPage() {
  const session = await getSession()
  if (!session) return null

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

  const eventCounts = await db
    .select({
      user_id: event_assignments.user_id,
      event_count: count(),
    })
    .from(event_assignments)
    .groupBy(event_assignments.user_id)

  const eventMap = new Map(eventCounts.map(e => [e.user_id, e.event_count]))

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

  return <ResourcesClient resources={resources} />
}
