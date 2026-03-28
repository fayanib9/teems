import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { lessons_learned, users, events } from '@/db/schema'
import { eq, desc, ilike, and, or } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = req.nextUrl.searchParams
    const search = url.get('search')
    const category = url.get('category')
    const event_id = url.get('event_id')
    const impact = url.get('impact')

    const conditions = []
    if (search) {
      conditions.push(
        or(
          ilike(lessons_learned.title, `%${search}%`),
          ilike(lessons_learned.description, `%${search}%`)
        )
      )
    }
    if (category) conditions.push(eq(lessons_learned.category, category))
    if (event_id) conditions.push(eq(lessons_learned.event_id, parseInt(event_id)))
    if (impact) conditions.push(eq(lessons_learned.impact, impact))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db
      .select({
        id: lessons_learned.id,
        event_id: lessons_learned.event_id,
        category: lessons_learned.category,
        title: lessons_learned.title,
        description: lessons_learned.description,
        impact: lessons_learned.impact,
        recommendation: lessons_learned.recommendation,
        created_by: lessons_learned.created_by,
        created_at: lessons_learned.created_at,
        author_first_name: users.first_name,
        author_last_name: users.last_name,
        event_title: events.title,
      })
      .from(lessons_learned)
      .leftJoin(users, eq(lessons_learned.created_by, users.id))
      .leftJoin(events, eq(lessons_learned.event_id, events.id))
      .where(where)
      .orderBy(desc(lessons_learned.created_at))

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
