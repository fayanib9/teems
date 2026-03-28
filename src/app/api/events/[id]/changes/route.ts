import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { change_requests, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = parseInt(id)

    const rows = await db
      .select({
        id: change_requests.id,
        title: change_requests.title,
        description: change_requests.description,
        change_type: change_requests.change_type,
        impact_assessment: change_requests.impact_assessment,
        status: change_requests.status,
        requested_by: change_requests.requested_by,
        approved_by: change_requests.approved_by,
        approved_at: change_requests.approved_at,
        created_at: change_requests.created_at,
        requester_first_name: users.first_name,
        requester_last_name: users.last_name,
      })
      .from(change_requests)
      .leftJoin(users, eq(change_requests.requested_by, users.id))
      .where(eq(change_requests.event_id, eventId))
      .orderBy(desc(change_requests.created_at))

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
    const { title, change_type, description, impact_assessment } = body

    if (!title || !change_type) {
      return NextResponse.json({ error: 'Title and change type are required' }, { status: 400 })
    }

    const [cr] = await db.insert(change_requests).values({
      event_id: eventId,
      title,
      change_type,
      description: description || null,
      impact_assessment: impact_assessment || null,
      requested_by: session.id,
      status: 'pending',
    }).returning()

    return NextResponse.json({ data: cr }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { change_request_id, status } = body

    if (!change_request_id || !status) {
      return NextResponse.json({ error: 'change_request_id and status are required' }, { status: 400 })
    }

    const [updated] = await db
      .update(change_requests)
      .set({
        status,
        approved_by: session.id,
        approved_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(change_requests.id, change_request_id))
      .returning()

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
