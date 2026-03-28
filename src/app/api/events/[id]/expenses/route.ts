import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { expenses } from '@/db/schema-extensions'
import { eq, and, sql } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = Number(id)
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const paymentStatus = searchParams.get('payment_status')

    const conditions = [eq(expenses.event_id, eventId)]
    if (category) conditions.push(eq(expenses.category, category))
    if (paymentStatus) conditions.push(eq(expenses.payment_status, paymentStatus))

    const rows = await db
      .select()
      .from(expenses)
      .where(and(...conditions))
      .orderBy(expenses.created_at)

    // Calculate totals
    const [totals] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(and(...conditions))

    // Calculate totals by category
    const categoryTotals = await db
      .select({
        category: expenses.category,
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(eq(expenses.event_id, eventId))
      .groupBy(expenses.category)

    const by_category: Record<string, number> = {}
    for (const row of categoryTotals) {
      by_category[row.category] = Number(row.total)
    }

    return NextResponse.json({
      data: rows,
      summary: {
        total: Number(totals.total),
        by_category,
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
    const { category, description, amount, currency, vendor_id, invoice_number, invoice_date, invoice_path, po_number, payment_status, payment_method, notes } = body

    if (!category?.trim()) return NextResponse.json({ error: 'Category required' }, { status: 400 })
    if (!description?.trim()) return NextResponse.json({ error: 'Description required' }, { status: 400 })
    if (!amount) return NextResponse.json({ error: 'Amount required' }, { status: 400 })

    const [row] = await db.insert(expenses).values({
      event_id: Number(id),
      category: category.trim(),
      description: description.trim(),
      amount: Number(amount),
      currency: currency || 'SAR',
      vendor_id: vendor_id ? Number(vendor_id) : null,
      invoice_number: invoice_number || null,
      invoice_date: invoice_date ? new Date(invoice_date) : null,
      invoice_path: invoice_path || null,
      po_number: po_number || null,
      payment_status: payment_status || 'pending',
      payment_method: payment_method || null,
      notes: notes || null,
      created_by: session.id,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
