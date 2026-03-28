import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { exhibitors, event_exhibitors } from '@/db/schema'
import { eq, desc, count, sql } from 'drizzle-orm'
import { z } from 'zod'

const createExhibitorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  contact_name: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

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
    const parsed = createExhibitorSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message, details: parsed.error.issues }, { status: 400 })
    }
    const data = parsed.data

    const [exhibitor] = await db.insert(exhibitors).values({
      name: data.name,
      contact_name: data.contact_name || null,
      email: data.email || null,
      phone: data.phone || null,
      website: data.website || null,
      industry: data.industry || null,
      notes: data.notes || null,
    }).returning()

    return NextResponse.json({ data: exhibitor }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
