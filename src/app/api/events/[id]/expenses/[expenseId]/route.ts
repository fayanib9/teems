import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { expenses } from '@/db/schema-extensions'
import { eq, and } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; expenseId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, expenseId } = await params

    const [row] = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, Number(expenseId)), eq(expenses.event_id, Number(id))))

    if (!row) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

    return NextResponse.json(row)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; expenseId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, expenseId } = await params
    const body = await req.json()

    const updates: Record<string, unknown> = { updated_at: new Date() }
    if (body.category !== undefined) updates.category = body.category.trim()
    if (body.description !== undefined) updates.description = body.description.trim()
    if (body.amount !== undefined) updates.amount = Number(body.amount)
    if (body.currency !== undefined) updates.currency = body.currency
    if (body.vendor_id !== undefined) updates.vendor_id = body.vendor_id ? Number(body.vendor_id) : null
    if (body.invoice_number !== undefined) updates.invoice_number = body.invoice_number || null
    if (body.invoice_date !== undefined) updates.invoice_date = body.invoice_date ? new Date(body.invoice_date) : null
    if (body.invoice_path !== undefined) updates.invoice_path = body.invoice_path || null
    if (body.po_number !== undefined) updates.po_number = body.po_number || null
    if (body.payment_method !== undefined) updates.payment_method = body.payment_method || null
    if (body.notes !== undefined) updates.notes = body.notes || null

    // Handle payment_status changes
    if (body.payment_status !== undefined) {
      updates.payment_status = body.payment_status
      if (body.payment_status === 'approved') {
        updates.approved_by = session.id
        updates.approved_at = new Date()
      }
      if (body.payment_status === 'paid') {
        updates.payment_date = body.payment_date ? new Date(body.payment_date) : new Date()
      }
    }

    const [row] = await db
      .update(expenses)
      .set(updates)
      .where(and(eq(expenses.id, Number(expenseId)), eq(expenses.event_id, Number(id))))
      .returning()

    if (!row) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

    return NextResponse.json(row)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; expenseId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, expenseId } = await params

    const [row] = await db
      .delete(expenses)
      .where(and(eq(expenses.id, Number(expenseId)), eq(expenses.event_id, Number(id))))
      .returning()

    if (!row) return NextResponse.json({ error: 'Expense not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
