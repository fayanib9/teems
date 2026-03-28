import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { event_meals } from '@/db/schema-extensions'
import { eq, and } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; mealId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, mealId } = await params
    const body = await req.json()

    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.meal_type !== undefined) updates.meal_type = body.meal_type
    if (body.date !== undefined) updates.date = new Date(body.date)
    if (body.start_time !== undefined) updates.start_time = body.start_time || null
    if (body.end_time !== undefined) updates.end_time = body.end_time || null
    if (body.location !== undefined) updates.location = body.location || null
    if (body.expected_headcount !== undefined) updates.expected_headcount = body.expected_headcount ? Number(body.expected_headcount) : null
    if (body.actual_headcount !== undefined) updates.actual_headcount = body.actual_headcount ? Number(body.actual_headcount) : null
    if (body.vendor_id !== undefined) updates.vendor_id = body.vendor_id ? Number(body.vendor_id) : null
    if (body.menu_description !== undefined) updates.menu_description = body.menu_description || null
    if (body.dietary_options !== undefined) {
      updates.dietary_options = body.dietary_options
        ? (typeof body.dietary_options === 'string' ? body.dietary_options : JSON.stringify(body.dietary_options))
        : null
    }
    if (body.cost_per_person !== undefined) updates.cost_per_person = body.cost_per_person ? Number(body.cost_per_person) : null
    if (body.total_cost !== undefined) updates.total_cost = body.total_cost ? Number(body.total_cost) : null
    if (body.status !== undefined) updates.status = body.status
    if (body.notes !== undefined) updates.notes = body.notes || null

    const [row] = await db
      .update(event_meals)
      .set(updates)
      .where(and(eq(event_meals.id, Number(mealId)), eq(event_meals.event_id, Number(id))))
      .returning()

    if (!row) return NextResponse.json({ error: 'Meal not found' }, { status: 404 })

    return NextResponse.json({ data: row })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; mealId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, mealId } = await params

    const [row] = await db
      .delete(event_meals)
      .where(and(eq(event_meals.id, Number(mealId)), eq(event_meals.event_id, Number(id))))
      .returning()

    if (!row) return NextResponse.json({ error: 'Meal not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
