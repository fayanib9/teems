import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { survey_templates } from '@/db/schema-extensions'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rows = await db
      .select()
      .from(survey_templates)
      .where(eq(survey_templates.is_active, true))
      .orderBy(survey_templates.created_at)

    return NextResponse.json(rows)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, target_audience, questions } = body

    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
    if (!target_audience) return NextResponse.json({ error: 'target_audience is required' }, { status: 400 })
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'questions must be a non-empty array' }, { status: 400 })
    }

    const [row] = await db.insert(survey_templates).values({
      name,
      description: description || null,
      target_audience,
      questions: JSON.stringify(questions),
      created_by: session.id,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
