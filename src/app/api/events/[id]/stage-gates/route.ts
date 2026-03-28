import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { stage_gates } from '@/db/schema-extensions'
import { users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = Number(id)

    const rows = await db
      .select({
        id: stage_gates.id,
        event_id: stage_gates.event_id,
        gate_name: stage_gates.gate_name,
        phase: stage_gates.phase,
        required_deliverables: stage_gates.required_deliverables,
        reviewer_id: stage_gates.reviewer_id,
        status: stage_gates.status,
        review_date: stage_gates.review_date,
        review_notes: stage_gates.review_notes,
        sort_order: stage_gates.sort_order,
        created_at: stage_gates.created_at,
        updated_at: stage_gates.updated_at,
        reviewer_first_name: users.first_name,
        reviewer_last_name: users.last_name,
      })
      .from(stage_gates)
      .leftJoin(users, eq(stage_gates.reviewer_id, users.id))
      .where(eq(stage_gates.event_id, eventId))
      .orderBy(stage_gates.sort_order)

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const eventId = Number(id)
    const body = await req.json()
    const { gate_name, phase, required_deliverables, status, reviewer_id, sort_order } = body

    if (!gate_name || !phase) {
      return NextResponse.json({ error: 'gate_name and phase are required' }, { status: 400 })
    }

    const [row] = await db.insert(stage_gates).values({
      event_id: eventId,
      gate_name,
      phase,
      required_deliverables: required_deliverables
        ? (typeof required_deliverables === 'string' ? required_deliverables : JSON.stringify(required_deliverables))
        : null,
      status: status || 'pending',
      reviewer_id: reviewer_id ? Number(reviewer_id) : null,
      sort_order: sort_order ?? 0,
    }).returning()

    return NextResponse.json({ data: row }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
