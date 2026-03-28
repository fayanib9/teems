import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { lessons_learned, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = parseInt(id)

    const rows = await db
      .select({
        id: lessons_learned.id,
        category: lessons_learned.category,
        title: lessons_learned.title,
        description: lessons_learned.description,
        impact: lessons_learned.impact,
        recommendation: lessons_learned.recommendation,
        created_by: lessons_learned.created_by,
        created_at: lessons_learned.created_at,
        author_first_name: users.first_name,
        author_last_name: users.last_name,
      })
      .from(lessons_learned)
      .leftJoin(users, eq(lessons_learned.created_by, users.id))
      .where(eq(lessons_learned.event_id, eventId))
      .orderBy(desc(lessons_learned.created_at))

    return NextResponse.json({ data: rows })
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
    const eventId = parseInt(id)
    const body = await req.json()
    const { category, title, description, impact, recommendation } = body

    if (!category || !title || !description) {
      return NextResponse.json({ error: 'Category, title, and description are required' }, { status: 400 })
    }

    const [lesson] = await db.insert(lessons_learned).values({
      event_id: eventId,
      category,
      title,
      description,
      impact: impact || null,
      recommendation: recommendation || null,
      created_by: session.id,
    }).returning()

    return NextResponse.json({ data: lesson }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
