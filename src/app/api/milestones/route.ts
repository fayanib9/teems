import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { milestones, tasks } from '@/db/schema'
import { eq, asc, count } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const event_id = req.nextUrl.searchParams.get('event_id')
    if (!event_id) return NextResponse.json({ error: 'event_id is required' }, { status: 400 })

    const rows = await db
      .select()
      .from(milestones)
      .where(eq(milestones.event_id, parseInt(event_id)))
      .orderBy(asc(milestones.due_date))

    return NextResponse.json({ data: rows })
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

    const { event_id, title, description, due_date } = await req.json()
    if (!event_id || !title || !due_date) {
      return NextResponse.json({ error: 'Event, title, and due date are required' }, { status: 400 })
    }

    const [milestone] = await db.insert(milestones).values({
      event_id,
      title,
      description: description || null,
      due_date: new Date(due_date),
    }).returning()

    return NextResponse.json({ data: milestone }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id: milestoneId, status, title, description, due_date } = body
    if (!milestoneId) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (status !== undefined) updates.status = status
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (due_date !== undefined) updates.due_date = new Date(due_date)

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const [updated] = await db.update(milestones).set(updates).where(eq(milestones.id, Number(milestoneId))).returning()
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const milestoneId = req.nextUrl.searchParams.get('id')
    if (!milestoneId) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await db.delete(milestones).where(eq(milestones.id, Number(milestoneId)))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
