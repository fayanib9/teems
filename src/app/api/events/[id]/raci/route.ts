import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { raci_assignments, tasks, users, event_assignments } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = parseInt(id)

    // Get tasks for this event
    const eventTasks = await db
      .select({ id: tasks.id, title: tasks.title })
      .from(tasks)
      .where(eq(tasks.event_id, eventId))

    // Get team members for this event
    const teamMembers = await db
      .select({
        user_id: event_assignments.user_id,
        first_name: users.first_name,
        last_name: users.last_name,
      })
      .from(event_assignments)
      .innerJoin(users, eq(event_assignments.user_id, users.id))
      .where(eq(event_assignments.event_id, eventId))

    // Get existing RACI assignments
    const raciRows = await db
      .select({
        id: raci_assignments.id,
        task_id: raci_assignments.task_id,
        user_id: raci_assignments.user_id,
        raci_type: raci_assignments.raci_type,
      })
      .from(raci_assignments)
      .where(eq(raci_assignments.event_id, eventId))

    return NextResponse.json({
      tasks: eventTasks,
      members: teamMembers,
      assignments: raciRows,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'tasks', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const eventId = parseInt(id)
    const body = await req.json()
    const { task_id, user_id, raci_type } = body

    if (!task_id || !user_id || !raci_type) {
      return NextResponse.json({ error: 'task_id, user_id, and raci_type are required' }, { status: 400 })
    }

    // Delete existing assignment for this task+user combo, then insert new one
    await db
      .delete(raci_assignments)
      .where(
        and(
          eq(raci_assignments.event_id, eventId),
          eq(raci_assignments.task_id, task_id),
          eq(raci_assignments.user_id, user_id),
        )
      )

    if (raci_type !== 'none') {
      const [assignment] = await db.insert(raci_assignments).values({
        event_id: eventId,
        task_id,
        user_id,
        raci_type,
      }).returning()

      return NextResponse.json({ data: assignment })
    }

    return NextResponse.json({ data: null })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
