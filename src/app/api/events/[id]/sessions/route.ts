import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { sessions } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.event_id, Number(id)))
      .orderBy(asc(sessions.date), asc(sessions.start_time))

    return NextResponse.json(rows)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authSession = await getSession()
    if (!authSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(authSession, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { title, description, session_type, date, start_time, end_time, location, capacity, sort_order, status } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
    if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 })
    if (!start_time) return NextResponse.json({ error: 'Start time required' }, { status: 400 })
    if (!end_time) return NextResponse.json({ error: 'End time required' }, { status: 400 })

    const [row] = await db.insert(sessions).values({
      event_id: Number(id),
      title: title.trim(),
      description: description || null,
      session_type: session_type || null,
      date: new Date(date),
      start_time,
      end_time,
      location: location || null,
      capacity: capacity ? Number(capacity) : null,
      sort_order: sort_order ? Number(sort_order) : 0,
      status: status || 'scheduled',
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authSession = await getSession()
    if (!authSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(authSession, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { session_id, title, description, session_type, date, start_time, end_time, location, capacity, sort_order, status } = body

    if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (title !== undefined) updates.title = title.trim()
    if (description !== undefined) updates.description = description || null
    if (session_type !== undefined) updates.session_type = session_type || null
    if (date !== undefined) updates.date = new Date(date)
    if (start_time !== undefined) updates.start_time = start_time
    if (end_time !== undefined) updates.end_time = end_time
    if (location !== undefined) updates.location = location || null
    if (capacity !== undefined) updates.capacity = capacity ? Number(capacity) : null
    if (sort_order !== undefined) updates.sort_order = Number(sort_order)
    if (status !== undefined) updates.status = status

    const [row] = await db.update(sessions).set(updates).where(eq(sessions.id, Number(session_id))).returning()
    return NextResponse.json(row)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
