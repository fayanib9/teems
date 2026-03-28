import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { risk_assessments } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const assessmentId = parseInt(id)
  if (isNaN(assessmentId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const [assessment] = await db.select().from(risk_assessments).where(eq(risk_assessments.id, assessmentId)).limit(1)
  if (!assessment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    ...assessment,
    form_data: JSON.parse(assessment.form_data),
    risks: JSON.parse(assessment.risks),
    mitigations: assessment.mitigations ? JSON.parse(assessment.mitigations) : [],
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await db.delete(risk_assessments).where(eq(risk_assessments.id, parseInt(id)))
  return NextResponse.json({ success: true })
}
