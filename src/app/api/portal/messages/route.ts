import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { portal_messages } from '@/db/schema-extensions'
import { users, events } from '@/db/schema'
import { eq, and, or, desc } from 'drizzle-orm'

const EXTERNAL_ROLES = ['client', 'vendor', 'speaker', 'exhibitor']

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!EXTERNAL_ROLES.includes(session.role_name)) {
      return NextResponse.json({ error: 'Forbidden — portal role required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('event_id')

    const conditions = [
      or(
        eq(portal_messages.sender_id, session.id),
        eq(portal_messages.recipient_id, session.id),
      ),
    ]

    if (eventId) {
      conditions.push(eq(portal_messages.event_id, Number(eventId)))
    }

    const rows = await db
      .select({
        id: portal_messages.id,
        event_id: portal_messages.event_id,
        sender_id: portal_messages.sender_id,
        recipient_id: portal_messages.recipient_id,
        subject: portal_messages.subject,
        content: portal_messages.content,
        is_read: portal_messages.is_read,
        read_at: portal_messages.read_at,
        attachment_path: portal_messages.attachment_path,
        parent_id: portal_messages.parent_id,
        created_at: portal_messages.created_at,
        sender_first_name: users.first_name,
        sender_last_name: users.last_name,
        event_title: events.title,
      })
      .from(portal_messages)
      .leftJoin(users, eq(portal_messages.sender_id, users.id))
      .leftJoin(events, eq(portal_messages.event_id, events.id))
      .where(and(...conditions))
      .orderBy(desc(portal_messages.created_at))

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
    const { event_id, recipient_id, subject, content, parent_id } = body

    if (!event_id || !content) {
      return NextResponse.json({ error: 'event_id and content are required' }, { status: 400 })
    }

    const [row] = await db.insert(portal_messages).values({
      event_id: Number(event_id),
      sender_id: session.id,
      recipient_id: recipient_id ? Number(recipient_id) : null,
      subject: subject || null,
      content,
      parent_id: parent_id ? Number(parent_id) : null,
    }).returning()

    return NextResponse.json({ data: row }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
