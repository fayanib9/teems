import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { exhibitors, event_exhibitors } from '@/db/schema'
import { eq, desc, count, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'exhibitors', 'view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const rows = await db.select().from(exhibitors).where(eq(exhibitors.is_active, true)).orderBy(desc(exhibitors.created_at))

    const ids = rows.map(r => r.id)
    const eventCounts = ids.length > 0
      ? await db.select({ exhibitor_id: event_exhibitors.exhibitor_id, count: count() }).from(event_exhibitors)
          .where(sql`${event_exhibitors.exhibitor_id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`)
          .groupBy(event_exhibitors.exhibitor_id)
      : []
    const countMap = Object.fromEntries(eventCounts.map(e => [e.exhibitor_id, e.count]))

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
    if (!hasPermission(session, 'exhibitors', 'create')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const [exhibitor] = await db.insert(exhibitors).values({
      name: body.name,
      contact_name: body.contact_name || null,
      email: body.email || null,
      phone: body.phone || null,
      website: body.website || null,
      industry: body.industry || null,
      notes: body.notes || null,
    }).returning()

    return NextResponse.json({ data: exhibitor }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
