import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { clients, events } from '@/db/schema'
import { eq, ilike, or, desc, count, sql } from 'drizzle-orm'
import { z } from 'zod'

const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  contact_name: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'clients', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = req.nextUrl.searchParams
    const search = url.get('search')
    const all = url.get('all') // if 'true', returns minimal list for dropdowns

    if (all === 'true') {
      const rows = await db
        .select({ id: clients.id, name: clients.name })
        .from(clients)
        .where(eq(clients.is_active, true))
        .orderBy(clients.name)
      return NextResponse.json({ data: rows })
    }

    const page = parseInt(url.get('page') || '1')
    const limit = parseInt(url.get('limit') || '20')

    const conditions = [eq(clients.is_active, true)]
    if (search) {
      conditions.push(
        or(
          ilike(clients.name, `%${search}%`),
          ilike(clients.contact_name, `%${search}%`),
          ilike(clients.email, `%${search}%`)
        )!
      )
    }

    const where = conditions.length > 1 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : conditions[0]

    const [totalResult] = await db.select({ count: count() }).from(clients).where(eq(clients.is_active, true))

    const rows = await db
      .select()
      .from(clients)
      .where(eq(clients.is_active, true))
      .orderBy(desc(clients.created_at))
      .limit(limit)
      .offset((page - 1) * limit)

    // Get event counts per client
    const clientIds = rows.map(r => r.id)
    const eventCounts = clientIds.length > 0
      ? await db
          .select({ client_id: events.client_id, count: count() })
          .from(events)
          .where(sql`${events.client_id} IN (${sql.join(clientIds.map(id => sql`${id}`), sql`, `)})`)
          .groupBy(events.client_id)
      : []

    const countMap = Object.fromEntries(eventCounts.map(e => [e.client_id, e.count]))

    return NextResponse.json({
      data: rows.map(r => ({ ...r, event_count: countMap[r.id] || 0 })),
      pagination: { page, limit, total: totalResult.count, pages: Math.ceil(totalResult.count / limit) },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'clients', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = createClientSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message, details: parsed.error.issues }, { status: 400 })
    }
    const { name, contact_name, email, phone, address, city, country, website, notes } = parsed.data

    const [client] = await db.insert(clients).values({
      name,
      contact_name: contact_name || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      country: country || null,
      website: website || null,
      notes: notes || null,
    }).returning()

    return NextResponse.json({ data: client }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
