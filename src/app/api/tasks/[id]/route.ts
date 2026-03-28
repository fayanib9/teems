import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { tasks, task_comments, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { logActivity } from '@/lib/activity'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const numId = parseInt(id)
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }
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
      .where(eq(tasks.id, numId))
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
      .where(eq(task_comments.task_id, numId))
      .orderBy(desc(task_comments.created_at))

    return NextResponse.json({ data: { ...task, comments } })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'tasks', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const numId = parseInt(id)
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }
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

    const [updated] = await db.update(tasks).set(updateData).where(eq(tasks.id, numId)).returning()
    if (!updated) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    logActivity({ userId: session.id, action: 'updated', resource: 'task', resourceId: numId, eventId: updated.event_id, details: JSON.stringify({ changes: Object.keys(body) }) }).catch(() => {})

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'tasks', 'delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const numId = parseInt(id)
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }
    // Soft-delete: mark task as cancelled instead of hard deleting
    const [deleted] = await db.update(tasks).set({ status: 'cancelled', updated_at: new Date() }).where(eq(tasks.id, numId)).returning({ id: tasks.id, event_id: tasks.event_id })
    if (!deleted) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    logActivity({ userId: session.id, action: 'deleted', resource: 'task', resourceId: numId, eventId: deleted.event_id }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
