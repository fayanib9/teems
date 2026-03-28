import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { event_sponsors } from '@/db/schema-extensions'
import { eq, and } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; sponsorId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, sponsorId } = await params
    const body = await req.json()

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (body.tier !== undefined) updates.tier = body.tier
    if (body.commitment_amount !== undefined) updates.commitment_amount = body.commitment_amount ? Number(body.commitment_amount) : null
    if (body.paid_amount !== undefined) updates.paid_amount = body.paid_amount ? Number(body.paid_amount) : 0
    if (body.deliverables !== undefined) updates.deliverables = body.deliverables
    if (body.deliverables_completed !== undefined) updates.deliverables_completed = body.deliverables_completed
    if (body.logo_placement !== undefined) updates.logo_placement = body.logo_placement || null
    if (body.status !== undefined) updates.status = body.status
    if (body.contract_path !== undefined) updates.contract_path = body.contract_path || null
    if (body.notes !== undefined) updates.notes = body.notes || null

    const [row] = await db
      .update(event_sponsors)
      .set(updates)
      .where(and(
        eq(event_sponsors.id, Number(sponsorId)),
        eq(event_sponsors.event_id, Number(id))
      ))
      .returning()

    if (!row) return NextResponse.json({ error: 'Event sponsor not found' }, { status: 404 })

    return NextResponse.json(row)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; sponsorId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, sponsorId } = await params

    const [row] = await db
      .delete(event_sponsors)
      .where(and(
        eq(event_sponsors.id, Number(sponsorId)),
        eq(event_sponsors.event_id, Number(id))
      ))
      .returning()

    if (!row) return NextResponse.json({ error: 'Event sponsor not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
