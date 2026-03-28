import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { quality_criteria } from '@/db/schema-extensions'
import { eq, and } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; criteriaId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, criteriaId } = await params
    const body = await req.json()

    const updates: Record<string, unknown> = {}
    if (body.category !== undefined) updates.category = body.category.trim()
    if (body.criterion !== undefined) updates.criterion = body.criterion.trim()
    if (body.measurement !== undefined) updates.measurement = body.measurement || null
    if (body.target_value !== undefined) updates.target_value = body.target_value || null
    if (body.actual_value !== undefined) updates.actual_value = body.actual_value || null
    if (body.notes !== undefined) updates.notes = body.notes || null
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order

    // Handle status changes with verification tracking
    if (body.status !== undefined) {
      updates.status = body.status
      if (['met', 'not_met', 'exceeded'].includes(body.status)) {
        updates.verified_by = session.id
        updates.verified_at = new Date()
      }
    }

    const [row] = await db
      .update(quality_criteria)
      .set(updates)
      .where(and(eq(quality_criteria.id, Number(criteriaId)), eq(quality_criteria.event_id, Number(id))))
      .returning()

    if (!row) return NextResponse.json({ error: 'Quality criterion not found' }, { status: 404 })

    return NextResponse.json({ data: row })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; criteriaId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, criteriaId } = await params

    const [row] = await db
      .delete(quality_criteria)
      .where(and(eq(quality_criteria.id, Number(criteriaId)), eq(quality_criteria.event_id, Number(id))))
      .returning()

    if (!row) return NextResponse.json({ error: 'Quality criterion not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
