import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { milestones, tasks } from '@/db/schema'
import { eq, asc, count } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const event_id = req.nextUrl.searchParams.get('event_id')
  if (!event_id) return NextResponse.json({ error: 'event_id is required' }, { status: 400 })

  const rows = await db
    .select()
    .from(milestones)
    .where(eq(milestones.event_id, parseInt(event_id)))
    .orderBy(asc(milestones.due_date))

  return NextResponse.json({ data: rows })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session, 'tasks', 'create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { event_id, title, description, due_date } = await req.json()
  if (!event_id || !title || !due_date) {
    return NextResponse.json({ error: 'Event, title, and due date are required' }, { status: 400 })
  }

  const [milestone] = await db.insert(milestones).values({
    event_id,
    title,
    description: description || null,
    due_date: new Date(due_date),
  }).returning()

  return NextResponse.json({ data: milestone }, { status: 201 })
}
