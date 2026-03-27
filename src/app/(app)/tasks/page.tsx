import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { tasks, users, events } from '@/db/schema'
import { eq, and, desc, asc } from 'drizzle-orm'
import { TasksPageClient } from './tasks-page-client'

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const session = await getSession()
  if (!session) return null

  const params = await searchParams
  const eventId = params.event_id
  const myTasks = params.my_tasks === 'true'

  const conditions = []
  if (eventId) conditions.push(eq(tasks.event_id, parseInt(eventId)))
  if (myTasks) conditions.push(eq(tasks.assigned_to, session.id))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const allTasks = await db
    .select({
      id: tasks.id,
      event_id: tasks.event_id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      assigned_to: tasks.assigned_to,
      due_date: tasks.due_date,
      sort_order: tasks.sort_order,
      created_at: tasks.created_at,
      assignee_first_name: users.first_name,
      assignee_last_name: users.last_name,
      event_title: events.title,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigned_to, users.id))
    .leftJoin(events, eq(tasks.event_id, events.id))
    .where(where)
    .orderBy(asc(tasks.sort_order), desc(tasks.created_at))

  // Get list of events for filter dropdown
  const eventList = await db
    .select({ id: events.id, title: events.title })
    .from(events)
    .orderBy(desc(events.created_at))
    .limit(50)

  // Get list of users for assignment
  const userList = await db
    .select({ id: users.id, first_name: users.first_name, last_name: users.last_name })
    .from(users)
    .where(eq(users.is_active, true))
    .orderBy(users.first_name)

  const canCreate = hasPermission(session, 'tasks', 'create')
  const canEdit = hasPermission(session, 'tasks', 'edit')

  return (
    <TasksPageClient
      tasks={allTasks}
      events={eventList}
      users={userList}
      canCreate={canCreate}
      canEdit={canEdit}
      filters={{ event_id: eventId, my_tasks: myTasks }}
      currentUserId={session.id}
    />
  )
}
