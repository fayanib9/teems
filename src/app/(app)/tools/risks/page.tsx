import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { risk_assessments } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { RiskClient } from './risk-client'

export default async function RiskAssessmentPage() {
  const session = await getSession()
  if (!session) return null

  const assessments = await db
    .select({
      id: risk_assessments.id,
      name: risk_assessments.name,
      overall_risk_level: risk_assessments.overall_risk_level,
      score: risk_assessments.score,
      created_at: risk_assessments.created_at,
    })
    .from(risk_assessments)
    .orderBy(desc(risk_assessments.created_at))

  return <RiskClient assessments={assessments} />
}
