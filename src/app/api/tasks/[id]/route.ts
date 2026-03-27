import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { tasks, task_comments, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const [task] = await db
    .select({
      id: tasks.id,
      event_id: tasks.event_id,
      milestone_id: tasks.milestone_id,
      parent_task_id: tasks.parent_task_id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      assigned_to: tasks.assigned_to,
      due_date: tasks.due_date,
      start_date: tasks.start_date,
      completed_at: tasks.completed_at,
      estimated_hours: tasks.estimated_hours,
      actual_hours: tasks.actual_hours,
      sort_order: tasks.sort_order,
      created_by: tasks.created_by,
      created_at: tasks.created_at,
      updated_at: tasks.updated_at,
      assignee_first_name: users.first_name,
      assignee_last_name: users.last_name,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigned_to, users.id))
    .where(eq(tasks.id, parseInt(id)))
    .limit(1)

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  // Get comments
  const comments = await db
    .select({
      id: task_comments.id,
      content: task_comments.content,
      created_at: task_comments.created_at,
      user_first_name: users.first_name,
      user_last_name: users.last_name,
    })
    .from(task_comments)
    .innerJoin(users, eq(task_comments.user_id, users.id))
    .where(eq(task_comments.task_id, parseInt(id)))
    .orderBy(desc(task_comments.created_at))

  return NextResponse.json({ data: { ...task, comments } })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session, 'tasks', 'edit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const updateData: Record<string, unknown> = { updated_at: new Date() }
  const allowedFields = [
    'title', 'description', 'status', 'priority', 'assigned_to', 'assigned_team_id',
    'due_date', 'start_date', 'estimated_hours', 'actual_hours', 'sort_order', 'milestone_id',
  ]

  for (const field of allowedFields) {
    if (field in body) {
      if ((field === 'due_date' || field === 'start_date') && body[field]) {
        updateData[field] = new Date(body[field])
      } else {
        updateData[field] = body[field]
      }
    }
  }

  // Auto-set completed_at
  if (body.status === 'done') updateData.completed_at = new Date()
  if (body.status && body.status !== 'done') updateData.completed_at = null

  const [updated] = await db.update(tasks).set(updateData).where(eq(tasks.id, parseInt(id))).returning()
  if (!updated) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session, 'tasks', 'delete')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const [deleted] = await db.delete(tasks).where(eq(tasks.id, parseInt(id))).returning({ id: tasks.id })
  if (!deleted) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}
