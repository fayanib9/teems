import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { vendor_payments } from '@/db/schema-extensions'
import { event_vendors } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, paymentId } = await params
    const body = await req.json()

    // Verify payment belongs to this event
    const [existing] = await db
      .select({ id: vendor_payments.id })
      .from(vendor_payments)
      .innerJoin(event_vendors, eq(vendor_payments.event_vendor_id, event_vendors.id))
      .where(and(eq(vendor_payments.id, Number(paymentId)), eq(event_vendors.event_id, Number(id))))

    if (!existing) return NextResponse.json({ error: 'Payment milestone not found' }, { status: 404 })

    const updates: Record<string, unknown> = {}
    if (body.milestone_name !== undefined) updates.milestone_name = body.milestone_name.trim()
    if (body.amount !== undefined) updates.amount = Number(body.amount)
    if (body.percentage !== undefined) updates.percentage = body.percentage ? Number(body.percentage) : null
    if (body.due_date !== undefined) updates.due_date = body.due_date ? new Date(body.due_date) : null
    if (body.payment_type !== undefined) {
      const validTypes = ['advance', 'milestone', 'final']
      if (!validTypes.includes(body.payment_type)) {
        return NextResponse.json({ error: 'Payment type must be advance, milestone, or final' }, { status: 400 })
      }
      updates.payment_type = body.payment_type
    }
    if (body.invoice_number !== undefined) updates.invoice_number = body.invoice_number || null
    if (body.invoice_path !== undefined) updates.invoice_path = body.invoice_path || null
    if (body.notes !== undefined) updates.notes = body.notes || null
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order)

    // Handle status changes
    if (body.status !== undefined) {
      const validStatuses = ['pending', 'invoiced', 'approved', 'paid']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Status must be pending, invoiced, approved, or paid' }, { status: 400 })
      }
      updates.status = body.status
      if (body.status === 'approved') {
        updates.approved_by = session.id
      }
      if (body.status === 'paid') {
        updates.paid_date = body.paid_date ? new Date(body.paid_date) : new Date()
      }
    }

    const [row] = await db
      .update(vendor_payments)
      .set(updates)
      .where(eq(vendor_payments.id, Number(paymentId)))
      .returning()

    if (!row) return NextResponse.json({ error: 'Payment milestone not found' }, { status: 404 })

    return NextResponse.json(row)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, paymentId } = await params

    // Verify payment belongs to this event before deleting
    const [existing] = await db
      .select({ id: vendor_payments.id })
      .from(vendor_payments)
      .innerJoin(event_vendors, eq(vendor_payments.event_vendor_id, event_vendors.id))
      .where(and(eq(vendor_payments.id, Number(paymentId)), eq(event_vendors.event_id, Number(id))))

    if (!existing) return NextResponse.json({ error: 'Payment milestone not found' }, { status: 404 })

    await db
      .delete(vendor_payments)
      .where(eq(vendor_payments.id, Number(paymentId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
