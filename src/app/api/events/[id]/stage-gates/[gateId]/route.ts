import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { stage_gates } from '@/db/schema-extensions'
import { eq, and } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; gateId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, gateId } = await params
    const body = await req.json()

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (body.gate_name !== undefined) updates.gate_name = body.gate_name
    if (body.phase !== undefined) updates.phase = body.phase
    if (body.required_deliverables !== undefined) {
      updates.required_deliverables = body.required_deliverables
        ? (typeof body.required_deliverables === 'string' ? body.required_deliverables : JSON.stringify(body.required_deliverables))
        : null
    }
    if (body.reviewer_id !== undefined) updates.reviewer_id = body.reviewer_id ? Number(body.reviewer_id) : null
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order

    // Handle status changes (pass/fail/waive)
    if (body.status !== undefined) {
      updates.status = body.status
      if (['passed', 'failed', 'waived'].includes(body.status)) {
        updates.review_date = new Date()
        updates.reviewer_id = updates.reviewer_id ?? session.id
      }
    }
    if (body.review_notes !== undefined) updates.review_notes = body.review_notes || null

    const [row] = await db
      .update(stage_gates)
      .set(updates)
      .where(and(eq(stage_gates.id, Number(gateId)), eq(stage_gates.event_id, Number(id))))
      .returning()

    if (!row) return NextResponse.json({ error: 'Stage gate not found' }, { status: 404 })

    return NextResponse.json({ data: row })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; gateId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, gateId } = await params

    const [row] = await db
      .delete(stage_gates)
      .where(and(eq(stage_gates.id, Number(gateId)), eq(stage_gates.event_id, Number(id))))
      .returning()

    if (!row) return NextResponse.json({ error: 'Stage gate not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
