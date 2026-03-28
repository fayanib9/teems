import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { generated_plans, generated_plan_tasks } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const planId = parseInt(id)
  if (isNaN(planId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const [plan] = await db
    .select()
    .from(generated_plans)
    .where(eq(generated_plans.id, planId))
    .limit(1)

  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const tasks = await db
    .select()
    .from(generated_plan_tasks)
    .where(eq(generated_plan_tasks.plan_id, planId))
    .orderBy(generated_plan_tasks.phase_order, generated_plan_tasks.sort_order)

  return NextResponse.json({
    ...plan,
    form_data: JSON.parse(plan.form_data),
    plan_data: plan.plan_data ? JSON.parse(plan.plan_data) : null,
    risks: plan.risks ? JSON.parse(plan.risks) : [],
    recommendations: plan.recommendations ? JSON.parse(plan.recommendations) : [],
    tasks,
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const planId = parseInt(id)
  if (isNaN(planId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (body.status) updates.status = body.status
  if (body.name) updates.name = body.name

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  updates.updated_at = new Date()

  await db.update(generated_plans).set(updates).where(eq(generated_plans.id, planId))

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const planId = parseInt(id)
  if (isNaN(planId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  await db.delete(generated_plans).where(eq(generated_plans.id, planId))

  return NextResponse.json({ success: true })
}
