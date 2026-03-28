import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { event_meals } from '@/db/schema-extensions'
import { vendors } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = Number(id)

    const rows = await db
      .select({
        id: event_meals.id,
        event_id: event_meals.event_id,
        name: event_meals.name,
        meal_type: event_meals.meal_type,
        date: event_meals.date,
        start_time: event_meals.start_time,
        end_time: event_meals.end_time,
        location: event_meals.location,
        expected_headcount: event_meals.expected_headcount,
        actual_headcount: event_meals.actual_headcount,
        vendor_id: event_meals.vendor_id,
        menu_description: event_meals.menu_description,
        dietary_options: event_meals.dietary_options,
        cost_per_person: event_meals.cost_per_person,
        total_cost: event_meals.total_cost,
        status: event_meals.status,
        notes: event_meals.notes,
        created_at: event_meals.created_at,
        vendor_name: vendors.name,
      })
      .from(event_meals)
      .leftJoin(vendors, eq(event_meals.vendor_id, vendors.id))
      .where(eq(event_meals.event_id, eventId))
      .orderBy(event_meals.date)

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
    const {
      name, meal_type, date, start_time, end_time, location,
      expected_headcount, vendor_id, menu_description,
      dietary_options, cost_per_person, total_cost, notes,
    } = body

    if (!meal_type || !date) {
      return NextResponse.json({ error: 'meal_type and date are required' }, { status: 400 })
    }

    const [row] = await db.insert(event_meals).values({
      event_id: eventId,
      name: name || `${meal_type}`,
      meal_type,
      date: new Date(date),
      start_time: start_time || null,
      end_time: end_time || null,
      location: location || null,
      expected_headcount: expected_headcount ? Number(expected_headcount) : null,
      vendor_id: vendor_id ? Number(vendor_id) : null,
      menu_description: menu_description || null,
      dietary_options: dietary_options
        ? (typeof dietary_options === 'string' ? dietary_options : JSON.stringify(dietary_options))
        : null,
      cost_per_person: cost_per_person ? Number(cost_per_person) : null,
      total_cost: total_cost ? Number(total_cost) : null,
      notes: notes || null,
    }).returning()

    return NextResponse.json({ data: row }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
