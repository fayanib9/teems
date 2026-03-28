import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { budget_calculations } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { BudgetClient } from './budget-client'

export default async function BudgetPage() {
  const session = await getSession()
  if (!session) return null

  const budgets = await db
    .select({
      id: budget_calculations.id,
      name: budget_calculations.name,
      total_estimated: budget_calculations.total_estimated,
      currency: budget_calculations.currency,
      created_at: budget_calculations.created_at,
    })
    .from(budget_calculations)
    .orderBy(desc(budget_calculations.created_at))

  return <BudgetClient budgets={budgets} />
}
