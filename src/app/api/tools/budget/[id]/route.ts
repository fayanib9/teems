import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { budget_calculations } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const budgetId = parseInt(id)
  if (isNaN(budgetId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const [budget] = await db
    .select()
    .from(budget_calculations)
    .where(eq(budget_calculations.id, budgetId))
    .limit(1)

  if (!budget) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    ...budget,
    form_data: JSON.parse(budget.form_data),
    breakdown: JSON.parse(budget.breakdown),
    benchmarks: budget.benchmarks ? JSON.parse(budget.benchmarks) : [],
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const budgetId = parseInt(id)
  if (isNaN(budgetId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  await db.delete(budget_calculations).where(eq(budget_calculations.id, budgetId))
  return NextResponse.json({ success: true })
}
