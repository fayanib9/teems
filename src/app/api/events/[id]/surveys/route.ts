import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { survey_responses, survey_templates } from '@/db/schema-extensions'
import { eq, sql } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = Number(id)

    const rows = await db
      .select({
        id: survey_responses.id,
        event_id: survey_responses.event_id,
        template_id: survey_responses.template_id,
        respondent_name: survey_responses.respondent_name,
        respondent_email: survey_responses.respondent_email,
        respondent_type: survey_responses.respondent_type,
        answers: survey_responses.answers,
        nps_score: survey_responses.nps_score,
        submitted_at: survey_responses.submitted_at,
        template_name: survey_templates.name,
      })
      .from(survey_responses)
      .leftJoin(survey_templates, eq(survey_responses.template_id, survey_templates.id))
      .where(eq(survey_responses.event_id, eventId))
      .orderBy(survey_responses.submitted_at)

    // NPS summary stats
    const scoresOnly = rows.filter(r => r.nps_score !== null)
    const total = scoresOnly.length
    let promoters = 0
    let passives = 0
    let detractors = 0

    for (const r of scoresOnly) {
      const score = r.nps_score!
      if (score >= 9) promoters++
      else if (score >= 7) passives++
      else detractors++
    }

    const nps_summary = {
      total_responses: total,
      promoters,
      passives,
      detractors,
      nps_score: total > 0 ? Math.round(((promoters - detractors) / total) * 100) : null,
      average_score: total > 0 ? Math.round((scoresOnly.reduce((s, r) => s + r.nps_score!, 0) / total) * 10) / 10 : null,
    }

    return NextResponse.json({ responses: rows, nps_summary })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { template_id, respondent_name, respondent_email, respondent_type, answers, nps_score } = body

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'answers object is required' }, { status: 400 })
    }

    const [row] = await db.insert(survey_responses).values({
      event_id: Number(id),
      template_id: template_id ? Number(template_id) : null,
      respondent_name: respondent_name || session.first_name + ' ' + session.last_name,
      respondent_email: respondent_email || session.email,
      respondent_type: respondent_type || session.role_name,
      answers: JSON.stringify(answers),
      nps_score: nps_score != null ? Number(nps_score) : null,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
