import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { event_success_metrics } from '@/db/schema-extensions'
import { eq, and } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; metricId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, metricId } = await params
    const body = await req.json()

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (body.metric_name !== undefined) updates.metric_name = body.metric_name.trim()
    if (body.category !== undefined) updates.category = body.category || null
    if (body.target_value !== undefined) updates.target_value = body.target_value
    if (body.actual_value !== undefined) updates.actual_value = body.actual_value || null
    if (body.unit !== undefined) updates.unit = body.unit || null
    if (body.achieved !== undefined) updates.achieved = body.achieved
    if (body.notes !== undefined) updates.notes = body.notes || null

    const [row] = await db
      .update(event_success_metrics)
      .set(updates)
      .where(and(eq(event_success_metrics.id, Number(metricId)), eq(event_success_metrics.event_id, Number(id))))
      .returning()

    if (!row) return NextResponse.json({ error: 'Success metric not found' }, { status: 404 })

    return NextResponse.json({ data: row })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; metricId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, metricId } = await params

    const [row] = await db
      .delete(event_success_metrics)
      .where(and(eq(event_success_metrics.id, Number(metricId)), eq(event_success_metrics.event_id, Number(id))))
      .returning()

    if (!row) return NextResponse.json({ error: 'Success metric not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
