import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { travel_arrangements } from '@/db/schema-extensions'
import { users } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = Number(id)
    const { searchParams } = new URL(req.url)
    const guestType = searchParams.get('guest_type')
    const flightStatus = searchParams.get('flight_status')
    const hotelStatus = searchParams.get('hotel_status')
    const visaStatus = searchParams.get('visa_status')

    const conditions = [eq(travel_arrangements.event_id, eventId)]
    if (guestType) conditions.push(eq(travel_arrangements.guest_type, guestType))
    if (flightStatus) conditions.push(eq(travel_arrangements.flight_status, flightStatus))
    if (hotelStatus) conditions.push(eq(travel_arrangements.hotel_status, hotelStatus))
    if (visaStatus) conditions.push(eq(travel_arrangements.visa_status, visaStatus))

    const rows = await db
      .select({
        id: travel_arrangements.id,
        event_id: travel_arrangements.event_id,
        user_id: travel_arrangements.user_id,
        guest_name: travel_arrangements.guest_name,
        guest_type: travel_arrangements.guest_type,
        flight_arrival: travel_arrangements.flight_arrival,
        flight_departure: travel_arrangements.flight_departure,
        flight_status: travel_arrangements.flight_status,
        flight_booking_ref: travel_arrangements.flight_booking_ref,
        hotel_name: travel_arrangements.hotel_name,
        hotel_check_in: travel_arrangements.hotel_check_in,
        hotel_check_out: travel_arrangements.hotel_check_out,
        hotel_confirmation: travel_arrangements.hotel_confirmation,
        hotel_room_type: travel_arrangements.hotel_room_type,
        hotel_status: travel_arrangements.hotel_status,
        airport_transfer: travel_arrangements.airport_transfer,
        transfer_details: travel_arrangements.transfer_details,
        visa_required: travel_arrangements.visa_required,
        visa_status: travel_arrangements.visa_status,
        visa_number: travel_arrangements.visa_number,
        per_diem_rate: travel_arrangements.per_diem_rate,
        per_diem_days: travel_arrangements.per_diem_days,
        total_cost: travel_arrangements.total_cost,
        notes: travel_arrangements.notes,
        created_at: travel_arrangements.created_at,
        updated_at: travel_arrangements.updated_at,
        user_first_name: users.first_name,
        user_last_name: users.last_name,
      })
      .from(travel_arrangements)
      .leftJoin(users, eq(travel_arrangements.user_id, users.id))
      .where(and(...conditions))
      .orderBy(desc(travel_arrangements.created_at))

    return NextResponse.json({ data: rows, meta: { count: rows.length } })
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
      user_id, guest_name, guest_type,
      flight_arrival, flight_departure, flight_status, flight_booking_ref,
      hotel_name, hotel_check_in, hotel_check_out, hotel_confirmation, hotel_room_type, hotel_status,
      airport_transfer, transfer_details,
      visa_required, visa_status, visa_number,
      per_diem_rate, per_diem_days, total_cost, notes,
    } = body

    if (!guest_name && !user_id) {
      return NextResponse.json({ error: 'guest_name or user_id is required' }, { status: 400 })
    }

    const [row] = await db.insert(travel_arrangements).values({
      event_id: eventId,
      user_id: user_id ? Number(user_id) : null,
      guest_name: guest_name || null,
      guest_type: guest_type || null,
      flight_arrival: flight_arrival
        ? (typeof flight_arrival === 'string' ? flight_arrival : JSON.stringify(flight_arrival))
        : null,
      flight_departure: flight_departure
        ? (typeof flight_departure === 'string' ? flight_departure : JSON.stringify(flight_departure))
        : null,
      flight_status: flight_status || 'pending',
      flight_booking_ref: flight_booking_ref || null,
      hotel_name: hotel_name || null,
      hotel_check_in: hotel_check_in ? new Date(hotel_check_in) : null,
      hotel_check_out: hotel_check_out ? new Date(hotel_check_out) : null,
      hotel_confirmation: hotel_confirmation || null,
      hotel_room_type: hotel_room_type || null,
      hotel_status: hotel_status || 'pending',
      airport_transfer: airport_transfer ?? false,
      transfer_details: transfer_details || null,
      visa_required: visa_required ?? false,
      visa_status: visa_status || 'not_required',
      visa_number: visa_number || null,
      per_diem_rate: per_diem_rate ? Number(per_diem_rate) : null,
      per_diem_days: per_diem_days ? Number(per_diem_days) : null,
      total_cost: total_cost ? Number(total_cost) : null,
      notes: notes || null,
    }).returning()

    return NextResponse.json({ data: row }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
