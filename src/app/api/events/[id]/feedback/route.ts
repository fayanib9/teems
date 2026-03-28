import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { event_feedback } from '@/db/schema-extensions'
import { eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = Number(id)

    const rows = await db
      .select()
      .from(event_feedback)
      .where(eq(event_feedback.event_id, eventId))
      .orderBy(desc(event_feedback.submitted_at))

    // Calculate averages
    const withRating = rows.filter(r => r.overall_rating !== null)
    const withNps = rows.filter(r => r.nps_score !== null)

    const ratingCategories = ['venue', 'organization', 'communication', 'overall'] as const
    const category_averages: Record<string, number | null> = {}

    for (const cat of ratingCategories) {
      const values: number[] = []
      for (const r of rows) {
        if (r.ratings) {
          try {
            const parsed = typeof r.ratings === 'string' ? JSON.parse(r.ratings) : r.ratings
            if (parsed[cat] != null) values.push(Number(parsed[cat]))
          } catch { /* skip */ }
        }
      }
      category_averages[cat] = values.length > 0
        ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
        : null
    }

    const promoters = withNps.filter(r => r.nps_score! >= 9).length
    const detractors = withNps.filter(r => r.nps_score! <= 6).length

    const summary = {
      total_responses: rows.length,
      average_rating: withRating.length > 0
        ? Math.round((withRating.reduce((s, r) => s + r.overall_rating!, 0) / withRating.length) * 10) / 10
        : null,
      category_averages,
      nps_score: withNps.length > 0
        ? Math.round(((promoters - detractors) / withNps.length) * 100)
        : null,
      would_recommend_pct: rows.filter(r => r.would_recommend !== null).length > 0
        ? Math.round((rows.filter(r => r.would_recommend === true).length / rows.filter(r => r.would_recommend !== null).length) * 100)
        : null,
    }

    return NextResponse.json({ feedback: rows, summary })
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
    const {
      respondent_type, respondent_id, respondent_name, respondent_email,
      nps_score, overall_rating, ratings, comments, suggestions, would_recommend,
    } = body

    if (overall_rating != null && (overall_rating < 1 || overall_rating > 5)) {
      return NextResponse.json({ error: 'overall_rating must be 1-5' }, { status: 400 })
    }
    if (nps_score != null && (nps_score < 0 || nps_score > 10)) {
      return NextResponse.json({ error: 'nps_score must be 0-10' }, { status: 400 })
    }

    const [row] = await db.insert(event_feedback).values({
      event_id: Number(id),
      respondent_type: respondent_type || session.role_name,
      respondent_id: respondent_id ? Number(respondent_id) : session.id,
      respondent_name: respondent_name || session.first_name + ' ' + session.last_name,
      respondent_email: respondent_email || session.email,
      nps_score: nps_score != null ? Number(nps_score) : null,
      overall_rating: overall_rating != null ? Number(overall_rating) : null,
      ratings: ratings ? JSON.stringify(ratings) : null,
      comments: comments || null,
      suggestions: suggestions || null,
      would_recommend: would_recommend ?? null,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
