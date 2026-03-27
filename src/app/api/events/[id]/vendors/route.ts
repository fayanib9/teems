import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { event_vendors, vendors } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const rows = await db
      .select({
        id: event_vendors.id,
        event_id: event_vendors.event_id,
        vendor_id: event_vendors.vendor_id,
        service_description: event_vendors.service_description,
        contract_amount: event_vendors.contract_amount,
        status: event_vendors.status,
        notes: event_vendors.notes,
        created_at: event_vendors.created_at,
        vendor_name: vendors.name,
        vendor_contact_name: vendors.contact_name,
        vendor_email: vendors.email,
        vendor_phone: vendors.phone,
        vendor_category: vendors.category,
      })
      .from(event_vendors)
      .innerJoin(vendors, eq(event_vendors.vendor_id, vendors.id))
      .where(eq(event_vendors.event_id, Number(id)))

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
    const { vendor_id, service_description, contract_amount, notes } = body

    if (!vendor_id) return NextResponse.json({ error: 'vendor_id required' }, { status: 400 })

    const [row] = await db.insert(event_vendors).values({
      event_id: Number(id),
      vendor_id: Number(vendor_id),
      service_description: service_description || null,
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

    await db.delete(event_vendors).where(eq(event_vendors.id, Number(assignmentId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
