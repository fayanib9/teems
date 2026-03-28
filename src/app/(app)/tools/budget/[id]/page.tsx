import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { budget_calculations } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { BudgetResultClient } from './budget-result-client'

export default async function BudgetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return null

  const { id } = await params
  const budgetId = parseInt(id)
  if (isNaN(budgetId)) notFound()

  const [budget] = await db.select().from(budget_calculations).where(eq(budget_calculations.id, budgetId)).limit(1)
  if (!budget) notFound()

  return (
    <BudgetResultClient
      budget={{
        ...budget,
        form_data: JSON.parse(budget.form_data),
        breakdown: JSON.parse(budget.breakdown),
        benchmarks: budget.benchmarks ? JSON.parse(budget.benchmarks) : [],
      }}
    />
  )
}
