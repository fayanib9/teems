import { getSession } from '@/lib/auth'
import { BudgetFormClient } from './budget-form-client'

export default async function NewBudgetPage() {
  const session = await getSession()
  if (!session) return null
  return <BudgetFormClient />
}
