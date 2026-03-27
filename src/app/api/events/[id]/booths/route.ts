import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { booths } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const rows = await db
      .select()
      .from(booths)
      .where(eq(booths.event_id, Number(id)))

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
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { booth_number, size, dimensions, location_zone, price, amenities, status } = body

    if (!booth_number?.trim()) return NextResponse.json({ error: 'Booth number required' }, { status: 400 })

    const [row] = await db.insert(booths).values({
      event_id: Number(id),
      booth_number: booth_number.trim(),
      size: size || null,
      dimensions: dimensions || null,
      location_zone: location_zone || null,
      price: price ? Number(price) : null,
      amenities: amenities || null,
      status: status || 'available',
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { booth_id, booth_number, size, dimensions, location_zone, price, amenities, status } = body

    if (!booth_id) return NextResponse.json({ error: 'booth_id required' }, { status: 400 })

    const updates: Record<string, unknown> = {}
    if (booth_number !== undefined) updates.booth_number = booth_number.trim()
    if (size !== undefined) updates.size = size || null
    if (dimensions !== undefined) updates.dimensions = dimensions || null
    if (location_zone !== undefined) updates.location_zone = location_zone || null
    if (price !== undefined) updates.price = price ? Number(price) : null
    if (amenities !== undefined) updates.amenities = amenities || null
    if (status !== undefined) updates.status = status

    const [row] = await db.update(booths).set(updates).where(eq(booths.id, Number(booth_id))).returning()
    return NextResponse.json(row)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
