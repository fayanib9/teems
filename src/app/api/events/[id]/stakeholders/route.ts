import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { stakeholders } from '@/db/schema-extensions'
import { eq, desc } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = Number(id)

    const rows = await db
      .select()
      .from(stakeholders)
      .where(eq(stakeholders.event_id, eventId))
      .orderBy(desc(stakeholders.created_at))

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
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const eventId = Number(id)
    const body = await req.json()
    const {
      name, title, organization, email, phone,
      influence_level, interest_level, communication_channel,
      engagement_strategy, notes,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const [row] = await db.insert(stakeholders).values({
      event_id: eventId,
      name,
      title: title || null,
      organization: organization || null,
      email: email || null,
      phone: phone || null,
      influence_level: influence_level || 'medium',
      interest_level: interest_level || 'medium',
      communication_channel: communication_channel || null,
      engagement_strategy: engagement_strategy || null,
      notes: notes || null,
    }).returning()

    return NextResponse.json({ data: row }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
