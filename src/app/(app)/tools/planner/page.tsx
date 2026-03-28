import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { generated_plans, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { PlannerClient } from './planner-client'

export default async function PlannerPage() {
  const session = await getSession()
  if (!session) return null

  const plans = await db
    .select({
      id: generated_plans.id,
      name: generated_plans.name,
      client_name: generated_plans.client_name,
      template_used: generated_plans.template_used,
      complexity_score: generated_plans.complexity_score,
      status: generated_plans.status,
      version: generated_plans.version,
      created_at: generated_plans.created_at,
      creator_name: users.first_name,
    })
    .from(generated_plans)
    .leftJoin(users, eq(generated_plans.created_by, users.id))
    .orderBy(desc(generated_plans.created_at))

  return <PlannerClient plans={plans} />
}
