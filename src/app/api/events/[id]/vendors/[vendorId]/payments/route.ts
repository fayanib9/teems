import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { vendor_payments } from '@/db/schema-extensions'
import { event_vendors } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; vendorId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, vendorId } = await params

    // Find the event_vendor assignment
    const [eventVendor] = await db
      .select()
      .from(event_vendors)
      .where(and(eq(event_vendors.event_id, Number(id)), eq(event_vendors.vendor_id, Number(vendorId))))

    if (!eventVendor) return NextResponse.json({ error: 'Vendor not assigned to this event' }, { status: 404 })

    const rows = await db
      .select()
      .from(vendor_payments)
      .where(eq(vendor_payments.event_vendor_id, eventVendor.id))
      .orderBy(vendor_payments.sort_order)

    return NextResponse.json(rows)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; vendorId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, vendorId } = await params
    const body = await req.json()
    const { milestone_name, amount, percentage, due_date, payment_type, invoice_number, invoice_path, notes, sort_order } = body

    if (!milestone_name?.trim()) return NextResponse.json({ error: 'Milestone name required' }, { status: 400 })
    if (!amount) return NextResponse.json({ error: 'Amount required' }, { status: 400 })
    if (!payment_type) return NextResponse.json({ error: 'Payment type required' }, { status: 400 })

    const validTypes = ['advance', 'milestone', 'final']
    if (!validTypes.includes(payment_type)) {
      return NextResponse.json({ error: 'Payment type must be advance, milestone, or final' }, { status: 400 })
    }

    // Find the event_vendor assignment
    const [eventVendor] = await db
      .select()
      .from(event_vendors)
      .where(and(eq(event_vendors.event_id, Number(id)), eq(event_vendors.vendor_id, Number(vendorId))))

    if (!eventVendor) return NextResponse.json({ error: 'Vendor not assigned to this event' }, { status: 404 })

    const [row] = await db.insert(vendor_payments).values({
      event_vendor_id: eventVendor.id,
      milestone_name: milestone_name.trim(),
      amount: Number(amount),
      percentage: percentage ? Number(percentage) : null,
      due_date: due_date ? new Date(due_date) : null,
      payment_type,
      invoice_number: invoice_number || null,
      invoice_path: invoice_path || null,
      notes: notes || null,
      sort_order: sort_order ? Number(sort_order) : 0,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
