import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { event_success_metrics } from '@/db/schema-extensions'
import { eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = Number(id)

    const rows = await db
      .select()
      .from(event_success_metrics)
      .where(eq(event_success_metrics.event_id, eventId))
      .orderBy(desc(event_success_metrics.created_at))

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
    const { metric_name, target_value, category, unit, actual_value, achieved, notes } = body

    if (!metric_name || !target_value) {
      return NextResponse.json({ error: 'metric_name and target_value are required' }, { status: 400 })
    }

    const [row] = await db.insert(event_success_metrics).values({
      event_id: eventId,
      metric_name,
      target_value,
      category: category || null,
      unit: unit || null,
      actual_value: actual_value || null,
      achieved: achieved ?? null,
      notes: notes || null,
    }).returning()

    return NextResponse.json({ data: row }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
