import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { tasks, users, events, milestones } from '@/db/schema'
import { eq, and, ilike, or, desc, asc, count, sql } from 'drizzle-orm'
import { logActivity } from '@/lib/activity'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'tasks', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = req.nextUrl.searchParams
    const page = parseInt(url.get('page') || '1')
    const limit = parseInt(url.get('limit') || '50')
    const status = url.get('status')
    const priority = url.get('priority')
    const event_id = url.get('event_id')
    const assigned_to = url.get('assigned_to')
    const search = url.get('search')
    const my_tasks = url.get('my_tasks')

    const conditions = []
    if (status) conditions.push(eq(tasks.status, status))
    if (priority) conditions.push(eq(tasks.priority, priority))
    if (event_id) conditions.push(eq(tasks.event_id, parseInt(event_id)))
    if (assigned_to) conditions.push(eq(tasks.assigned_to, parseInt(assigned_to)))
    if (my_tasks === 'true') conditions.push(eq(tasks.assigned_to, session.id))
    if (search) conditions.push(ilike(tasks.title, `%${search}%`))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [totalResult] = await db.select({ count: count() }).from(tasks).where(where)

    const rows = await db
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
        created_at: tasks.created_at,
        updated_at: tasks.updated_at,
        assignee_first_name: users.first_name,
        assignee_last_name: users.last_name,
        event_title: events.title,
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigned_to, users.id))
      .leftJoin(events, eq(tasks.event_id, events.id))
      .where(where)
      .orderBy(asc(tasks.sort_order), desc(tasks.created_at))
      .limit(limit)
      .offset((page - 1) * limit)

    return NextResponse.json({
      data: rows,
      pagination: { page, limit, total: totalResult.count, pages: Math.ceil(totalResult.count / limit) },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'tasks', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { event_id, milestone_id, parent_task_id, title, description, status: taskStatus, priority, assigned_to, due_date, start_date, estimated_hours } = body

    if (!event_id || !title) {
      return NextResponse.json({ error: 'Event and title are required' }, { status: 400 })
    }

    const [task] = await db.insert(tasks).values({
      event_id,
      milestone_id: milestone_id || null,
      parent_task_id: parent_task_id || null,
      title,
      description: description || null,
      status: taskStatus || 'todo',
      priority: priority || 'medium',
      assigned_to: assigned_to || null,
      due_date: due_date ? new Date(due_date) : null,
      start_date: start_date ? new Date(start_date) : null,
      estimated_hours: estimated_hours || null,
      created_by: session.id,
    }).returning()

    logActivity({ userId: session.id, action: 'created', resource: 'task', resourceId: task.id, eventId: event_id, details: JSON.stringify({ title }) }).catch(() => {})

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
