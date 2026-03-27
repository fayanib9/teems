import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { speakers, event_speakers } from '@/db/schema'
import { eq, desc, count, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'speakers', 'view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const all = req.nextUrl.searchParams.get('all')
    if (all === 'true') {
      const rows = await db.select({ id: speakers.id, name: speakers.name }).from(speakers).where(eq(speakers.is_active, true)).orderBy(speakers.name)
      return NextResponse.json({ data: rows })
    }

    const rows = await db.select().from(speakers).where(eq(speakers.is_active, true)).orderBy(desc(speakers.created_at))

    const speakerIds = rows.map(r => r.id)
    const eventCounts = speakerIds.length > 0
      ? await db.select({ speaker_id: event_speakers.speaker_id, count: count() }).from(event_speakers)
          .where(sql`${event_speakers.speaker_id} IN (${sql.join(speakerIds.map(id => sql`${id}`), sql`, `)})`)
          .groupBy(event_speakers.speaker_id)
      : []
    const countMap = Object.fromEntries(eventCounts.map(e => [e.speaker_id, e.count]))

    return NextResponse.json({ data: rows.map(r => ({ ...r, event_count: countMap[r.id] || 0 })) })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'speakers', 'create')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const [speaker] = await db.insert(speakers).values({
      name: body.name,
      title: body.title || null,
      organization: body.organization || null,
      bio: body.bio || null,
      email: body.email || null,
      phone: body.phone || null,
      website: body.website || null,
    }).returning()

    return NextResponse.json({ data: speaker }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
