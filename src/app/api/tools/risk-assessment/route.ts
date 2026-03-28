import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { risk_assessments } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { assessRisks } from '@/engine/risk-assessor'
import type { RiskFormData } from '@/engine/types'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const assessments = await db
    .select()
    .from(risk_assessments)
    .orderBy(desc(risk_assessments.created_at))

  return NextResponse.json(assessments.map(a => ({
    ...a,
    form_data: JSON.parse(a.form_data),
    risks: JSON.parse(a.risks),
    mitigations: a.mitigations ? JSON.parse(a.mitigations) : [],
  })))
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const formData: RiskFormData = {
      name: body.name || 'Untitled Assessment',
      event_id: body.event_id || undefined,
      event_type: body.event_type || 'conference',
      event_date: body.event_date || '',
      attendees: body.attendees || 500,
      budget_range: body.budget_range || '500k_2m',
      venue_type: body.venue_type || 'indoor',
      services: body.services || [],
      has_vip: body.has_vip || false,
      has_government: body.has_government || false,
      has_international_speakers: body.has_international_speakers || false,
      has_custom_builds: body.has_custom_builds || false,
      days_remaining: body.days_remaining || 90,
    }

    const result = await assessRisks(formData)

    const [saved] = await db
      .insert(risk_assessments)
      .values({
        name: formData.name,
        event_id: formData.event_id || null,
        form_data: JSON.stringify(formData),
        overall_risk_level: result.overall_level,
        risks: JSON.stringify(result.risks),
        mitigations: JSON.stringify(result.mitigations),
        score: result.score,
        created_by: session.id,
      })
      .returning({ id: risk_assessments.id })

    return NextResponse.json({ id: saved.id, ...result }, { status: 201 })
  } catch (err) {
    console.error('Risk assessment error:', err)
    return NextResponse.json({ error: 'Failed to assess risks' }, { status: 500 })
  }
}
