import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { risk_assessments } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { RiskResultClient } from './risk-result-client'

export default async function RiskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return null

  const { id } = await params
  const assessmentId = parseInt(id)
  if (isNaN(assessmentId)) notFound()

  const [assessment] = await db.select().from(risk_assessments).where(eq(risk_assessments.id, assessmentId)).limit(1)
  if (!assessment) notFound()

  return (
    <RiskResultClient
      assessment={{
        ...assessment,
        form_data: JSON.parse(assessment.form_data),
        risks: JSON.parse(assessment.risks),
        mitigations: assessment.mitigations ? JSON.parse(assessment.mitigations) : [],
      }}
    />
  )
}
