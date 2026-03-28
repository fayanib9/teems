import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { generated_plans, generated_plan_tasks } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { PlanDetailClient } from './plan-detail-client'

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return null

  const { id } = await params
  const planId = parseInt(id)
  if (isNaN(planId)) notFound()

  const [plan] = await db
    .select()
    .from(generated_plans)
    .where(eq(generated_plans.id, planId))
    .limit(1)

  if (!plan) notFound()

  const tasks = await db
    .select()
    .from(generated_plan_tasks)
    .where(eq(generated_plan_tasks.plan_id, planId))
    .orderBy(asc(generated_plan_tasks.phase_order), asc(generated_plan_tasks.sort_order))

  const parsed = {
    ...plan,
    form_data: JSON.parse(plan.form_data),
    plan_data: plan.plan_data ? JSON.parse(plan.plan_data) : null,
    risks: plan.risks ? JSON.parse(plan.risks) : [],
    recommendations: plan.recommendations ? JSON.parse(plan.recommendations) : [],
  }

  return <PlanDetailClient plan={parsed} tasks={tasks} />
}
