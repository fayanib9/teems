import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { event_exhibitors, exhibitors, booths } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const rows = await db
      .select({
        id: event_exhibitors.id,
        event_id: event_exhibitors.event_id,
        exhibitor_id: event_exhibitors.exhibitor_id,
        booth_id: event_exhibitors.booth_id,
        package_type: event_exhibitors.package_type,
        contract_amount: event_exhibitors.contract_amount,
        status: event_exhibitors.status,
        special_requirements: event_exhibitors.special_requirements,
        notes: event_exhibitors.notes,
        created_at: event_exhibitors.created_at,
        exhibitor_name: exhibitors.name,
        exhibitor_contact_name: exhibitors.contact_name,
        exhibitor_email: exhibitors.email,
        exhibitor_phone: exhibitors.phone,
        exhibitor_industry: exhibitors.industry,
        booth_number: booths.booth_number,
        booth_location_zone: booths.location_zone,
      })
      .from(event_exhibitors)
      .innerJoin(exhibitors, eq(event_exhibitors.exhibitor_id, exhibitors.id))
      .leftJoin(booths, eq(event_exhibitors.booth_id, booths.id))
      .where(eq(event_exhibitors.event_id, Number(id)))

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
    const { exhibitor_id, booth_id, package_type, contract_amount, notes } = body

    if (!exhibitor_id) return NextResponse.json({ error: 'exhibitor_id required' }, { status: 400 })

    const [row] = await db.insert(event_exhibitors).values({
      event_id: Number(id),
      exhibitor_id: Number(exhibitor_id),
      booth_id: booth_id ? Number(booth_id) : null,
      package_type: package_type || null,
      contract_amount: contract_amount ? Number(contract_amount) : null,
      notes: notes || null,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const assignmentId = searchParams.get('assignment_id')

    if (!assignmentId) return NextResponse.json({ error: 'assignment_id required' }, { status: 400 })

    await db.delete(event_exhibitors).where(eq(event_exhibitors.id, Number(assignmentId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
