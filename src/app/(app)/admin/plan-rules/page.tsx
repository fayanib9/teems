import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { plan_rules } from '@/db/schema'
import { asc, eq } from 'drizzle-orm'
import { RulesClient } from './rules-client'

export default async function PlanRulesPage() {
  const session = await getSession()
  if (!session) return null

  const rules = await db.select().from(plan_rules).where(eq(plan_rules.is_active, true)).orderBy(asc(plan_rules.priority))

  return <RulesClient rules={rules.map(r => ({
    ...r,
    condition: JSON.parse(r.condition),
    actions: JSON.parse(r.actions),
  }))} />
}
