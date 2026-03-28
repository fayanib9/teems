import { getSession } from '@/lib/auth'
import { RiskFormClient } from './risk-form-client'

export default async function NewRiskAssessmentPage() {
  const session = await getSession()
  if (!session) return null
  return <RiskFormClient />
}
