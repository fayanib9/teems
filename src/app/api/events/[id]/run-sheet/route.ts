import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { run_sheet_items, users } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const rows = await db
      .select({
        id: run_sheet_items.id,
        title: run_sheet_items.title,
        description: run_sheet_items.description,
        scheduled_time: run_sheet_items.scheduled_time,
        duration_minutes: run_sheet_items.duration_minutes,
        location: run_sheet_items.location,
        responsible_user_id: run_sheet_items.responsible_user_id,
        status: run_sheet_items.status,
        sort_order: run_sheet_items.sort_order,
        notes: run_sheet_items.notes,
        completed_at: run_sheet_items.completed_at,
        created_at: run_sheet_items.created_at,
        responsible_name: users.first_name,
      })
      .from(run_sheet_items)
      .leftJoin(users, eq(run_sheet_items.responsible_user_id, users.id))
      .where(eq(run_sheet_items.event_id, Number(id)))
      .orderBy(asc(run_sheet_items.sort_order), asc(run_sheet_items.scheduled_time))

    return NextResponse.json(rows)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { title, description, scheduled_time, duration_minutes, location, responsible_user_id, sort_order } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

    const [item] = await db.insert(run_sheet_items).values({
      event_id: Number(id),
      title: title.trim(),
      description: description || null,
      scheduled_time: scheduled_time ? new Date(scheduled_time) : null,
      duration_minutes: duration_minutes ? Number(duration_minutes) : null,
      location: location || null,
      responsible_user_id: responsible_user_id ? Number(responsible_user_id) : null,
      sort_order: sort_order ? Number(sort_order) : 0,
    }).returning()

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { item_id, status, notes } = body

    if (!item_id) return NextResponse.json({ error: 'item_id required' }, { status: 400 })

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (status !== undefined) {
      updates.status = status
      if (status === 'completed') updates.completed_at = new Date()
    }
    if (notes !== undefined) updates.notes = notes

    const [item] = await db.update(run_sheet_items).set(updates).where(eq(run_sheet_items.id, Number(item_id))).returning()
    return NextResponse.json(item)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
