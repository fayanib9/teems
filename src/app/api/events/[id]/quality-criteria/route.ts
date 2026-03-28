import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { quality_criteria } from '@/db/schema-extensions'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = Number(id)

    const rows = await db
      .select({
        id: quality_criteria.id,
        event_id: quality_criteria.event_id,
        category: quality_criteria.category,
        criterion: quality_criteria.criterion,
        measurement: quality_criteria.measurement,
        target_value: quality_criteria.target_value,
        actual_value: quality_criteria.actual_value,
        status: quality_criteria.status,
        verified_by: quality_criteria.verified_by,
        verified_at: quality_criteria.verified_at,
        notes: quality_criteria.notes,
        sort_order: quality_criteria.sort_order,
        created_at: quality_criteria.created_at,
        verifier_first_name: users.first_name,
        verifier_last_name: users.last_name,
      })
      .from(quality_criteria)
      .leftJoin(users, eq(quality_criteria.verified_by, users.id))
      .where(eq(quality_criteria.event_id, eventId))
      .orderBy(quality_criteria.sort_order)

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
    const { category, criterion, measurement, target_value, actual_value, status, notes, sort_order } = body

    if (!category?.trim()) return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    if (!criterion?.trim()) return NextResponse.json({ error: 'Criterion is required' }, { status: 400 })

    const [row] = await db.insert(quality_criteria).values({
      event_id: eventId,
      category: category.trim(),
      criterion: criterion.trim(),
      measurement: measurement || null,
      target_value: target_value || null,
      actual_value: actual_value || null,
      status: status || 'pending',
      notes: notes || null,
      sort_order: sort_order ?? 0,
    }).returning()

    return NextResponse.json({ data: row }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
