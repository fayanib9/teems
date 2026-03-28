import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { budget_calculations } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { calculateBudget } from '@/engine/budget-calculator'
import type { BudgetFormData } from '@/engine/types'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const budgets = await db
    .select()
    .from(budget_calculations)
    .orderBy(desc(budget_calculations.created_at))

  return NextResponse.json(budgets.map(b => ({
    ...b,
    form_data: JSON.parse(b.form_data),
    breakdown: JSON.parse(b.breakdown),
    benchmarks: b.benchmarks ? JSON.parse(b.benchmarks) : [],
  })))
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const formData: BudgetFormData = {
      name: body.name || 'Untitled Budget',
      event_id: body.event_id || undefined,
      event_type: body.event_type || 'conference',
      attendees: body.attendees || 500,
      duration_days: body.duration_days || 1,
      venue_type: body.venue_type || 'indoor',
      services: body.services || [],
      has_vip: body.has_vip || false,
      has_government: body.has_government || false,
      has_international_speakers: body.has_international_speakers || false,
      notes: body.notes || '',
    }

    const result = await calculateBudget(formData)

    const [saved] = await db
      .insert(budget_calculations)
      .values({
        name: formData.name,
        event_id: formData.event_id || null,
        form_data: JSON.stringify(formData),
        total_estimated: result.total_estimated,
        breakdown: JSON.stringify(result.breakdown),
        benchmarks: JSON.stringify(result.benchmarks),
        currency: result.currency,
        created_by: session.id,
      })
      .returning({ id: budget_calculations.id })

    return NextResponse.json({ id: saved.id, ...result }, { status: 201 })
  } catch (err) {
    console.error('Budget calculation error:', err)
    return NextResponse.json({ error: 'Failed to calculate budget' }, { status: 500 })
  }
}
