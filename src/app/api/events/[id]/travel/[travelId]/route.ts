import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { travel_arrangements } from '@/db/schema-extensions'
import { eq, and } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; travelId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, travelId } = await params
    const body = await req.json()

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (body.user_id !== undefined) updates.user_id = body.user_id ? Number(body.user_id) : null
    if (body.guest_name !== undefined) updates.guest_name = body.guest_name || null
    if (body.guest_type !== undefined) updates.guest_type = body.guest_type || null
    // Flight
    if (body.flight_arrival !== undefined) {
      updates.flight_arrival = body.flight_arrival
        ? (typeof body.flight_arrival === 'string' ? body.flight_arrival : JSON.stringify(body.flight_arrival))
        : null
    }
    if (body.flight_departure !== undefined) {
      updates.flight_departure = body.flight_departure
        ? (typeof body.flight_departure === 'string' ? body.flight_departure : JSON.stringify(body.flight_departure))
        : null
    }
    if (body.flight_status !== undefined) updates.flight_status = body.flight_status
    if (body.flight_booking_ref !== undefined) updates.flight_booking_ref = body.flight_booking_ref || null
    // Hotel
    if (body.hotel_name !== undefined) updates.hotel_name = body.hotel_name || null
    if (body.hotel_check_in !== undefined) updates.hotel_check_in = body.hotel_check_in ? new Date(body.hotel_check_in) : null
    if (body.hotel_check_out !== undefined) updates.hotel_check_out = body.hotel_check_out ? new Date(body.hotel_check_out) : null
    if (body.hotel_confirmation !== undefined) updates.hotel_confirmation = body.hotel_confirmation || null
    if (body.hotel_room_type !== undefined) updates.hotel_room_type = body.hotel_room_type || null
    if (body.hotel_status !== undefined) updates.hotel_status = body.hotel_status
    // Transfer
    if (body.airport_transfer !== undefined) updates.airport_transfer = body.airport_transfer
    if (body.transfer_details !== undefined) updates.transfer_details = body.transfer_details || null
    // Visa
    if (body.visa_required !== undefined) updates.visa_required = body.visa_required
    if (body.visa_status !== undefined) updates.visa_status = body.visa_status
    if (body.visa_number !== undefined) updates.visa_number = body.visa_number || null
    // Per diem
    if (body.per_diem_rate !== undefined) updates.per_diem_rate = body.per_diem_rate ? Number(body.per_diem_rate) : null
    if (body.per_diem_days !== undefined) updates.per_diem_days = body.per_diem_days ? Number(body.per_diem_days) : null
    if (body.total_cost !== undefined) updates.total_cost = body.total_cost ? Number(body.total_cost) : null
    if (body.notes !== undefined) updates.notes = body.notes || null

    const [row] = await db
      .update(travel_arrangements)
      .set(updates)
      .where(and(eq(travel_arrangements.id, Number(travelId)), eq(travel_arrangements.event_id, Number(id))))
      .returning()

    if (!row) return NextResponse.json({ error: 'Travel arrangement not found' }, { status: 404 })

    return NextResponse.json({ data: row })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; travelId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, travelId } = await params

    const [row] = await db
      .delete(travel_arrangements)
      .where(and(eq(travel_arrangements.id, Number(travelId)), eq(travel_arrangements.event_id, Number(id))))
      .returning()

    if (!row) return NextResponse.json({ error: 'Travel arrangement not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
