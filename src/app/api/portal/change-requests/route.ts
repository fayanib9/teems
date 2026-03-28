import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { change_requests, events } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

const EXTERNAL_ROLES = ['client', 'vendor', 'speaker', 'exhibitor']

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!EXTERNAL_ROLES.includes(session.role_name)) {
      return NextResponse.json({ error: 'Forbidden — portal role required' }, { status: 403 })
    }

    const rows = await db
      .select({
        id: change_requests.id,
        event_id: change_requests.event_id,
        title: change_requests.title,
        description: change_requests.description,
        change_type: change_requests.change_type,
        impact_assessment: change_requests.impact_assessment,
        status: change_requests.status,
        approved_by: change_requests.approved_by,
        approved_at: change_requests.approved_at,
        created_at: change_requests.created_at,
        event_title: events.title,
      })
      .from(change_requests)
      .leftJoin(events, eq(change_requests.event_id, events.id))
      .where(eq(change_requests.requested_by, session.id))
      .orderBy(desc(change_requests.created_at))

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!EXTERNAL_ROLES.includes(session.role_name)) {
      return NextResponse.json({ error: 'Forbidden — portal role required' }, { status: 403 })
    }

    const body = await req.json()
    const { event_id, title, change_type, description, impact_assessment } = body

    if (!event_id || !title || !change_type) {
      return NextResponse.json({ error: 'event_id, title, and change_type are required' }, { status: 400 })
    }

    const [row] = await db.insert(change_requests).values({
      event_id: Number(event_id),
      title,
      change_type,
      description: description || null,
      impact_assessment: impact_assessment || null,
      requested_by: session.id,
      status: 'pending',
    }).returning()

    return NextResponse.json({ data: row }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
