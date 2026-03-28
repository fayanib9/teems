import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { vendor_payments } from '@/db/schema-extensions'
import { event_vendors, vendors } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = Number(id)
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const paymentType = searchParams.get('payment_type')

    let query = db
      .select({
        id: vendor_payments.id,
        event_vendor_id: vendor_payments.event_vendor_id,
        milestone_name: vendor_payments.milestone_name,
        amount: vendor_payments.amount,
        percentage: vendor_payments.percentage,
        due_date: vendor_payments.due_date,
        payment_type: vendor_payments.payment_type,
        status: vendor_payments.status,
        invoice_number: vendor_payments.invoice_number,
        invoice_path: vendor_payments.invoice_path,
        paid_date: vendor_payments.paid_date,
        approved_by: vendor_payments.approved_by,
        notes: vendor_payments.notes,
        sort_order: vendor_payments.sort_order,
        created_at: vendor_payments.created_at,
        vendor_id: vendors.id,
        vendor_name: vendors.name,
        vendor_category: vendors.category,
        service_description: event_vendors.service_description,
        contract_amount: event_vendors.contract_amount,
      })
      .from(vendor_payments)
      .innerJoin(event_vendors, eq(vendor_payments.event_vendor_id, event_vendors.id))
      .innerJoin(vendors, eq(event_vendors.vendor_id, vendors.id))
      .where(eq(event_vendors.event_id, eventId))
      .orderBy(vendors.name, vendor_payments.sort_order)
      .$dynamic()

    if (status) {
      query = query.where(and(eq(event_vendors.event_id, eventId), eq(vendor_payments.status, status)))
    }
    if (paymentType) {
      query = query.where(and(eq(event_vendors.event_id, eventId), eq(vendor_payments.payment_type, paymentType)))
    }

    const rows = await query

    // Summary totals
    const [totals] = await db
      .select({
        total_amount: sql<number>`COALESCE(SUM(${vendor_payments.amount}), 0)`,
        total_paid: sql<number>`COALESCE(SUM(CASE WHEN ${vendor_payments.status} = 'paid' THEN ${vendor_payments.amount} ELSE 0 END), 0)`,
        total_pending: sql<number>`COALESCE(SUM(CASE WHEN ${vendor_payments.status} IN ('pending', 'invoiced', 'approved') THEN ${vendor_payments.amount} ELSE 0 END), 0)`,
      })
      .from(vendor_payments)
      .innerJoin(event_vendors, eq(vendor_payments.event_vendor_id, event_vendors.id))
      .where(eq(event_vendors.event_id, eventId))

    return NextResponse.json({
      data: rows,
      summary: {
        total_amount: Number(totals.total_amount),
        total_paid: Number(totals.total_paid),
        total_pending: Number(totals.total_pending),
      },
      meta: { count: rows.length },
    })
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
    const { event_vendor_id, milestone_name, amount, percentage, due_date, payment_type, invoice_number, invoice_path, notes, sort_order } = body

    if (!event_vendor_id) return NextResponse.json({ error: 'Event vendor ID required' }, { status: 400 })
    if (!milestone_name?.trim()) return NextResponse.json({ error: 'Milestone name required' }, { status: 400 })
    if (!amount) return NextResponse.json({ error: 'Amount required' }, { status: 400 })
    if (!payment_type) return NextResponse.json({ error: 'Payment type required' }, { status: 400 })

    const validTypes = ['advance', 'milestone', 'final']
    if (!validTypes.includes(payment_type)) {
      return NextResponse.json({ error: 'Payment type must be advance, milestone, or final' }, { status: 400 })
    }

    // Verify event_vendor belongs to this event
    const [eventVendor] = await db
      .select()
      .from(event_vendors)
      .where(and(eq(event_vendors.id, Number(event_vendor_id)), eq(event_vendors.event_id, Number(id))))

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
