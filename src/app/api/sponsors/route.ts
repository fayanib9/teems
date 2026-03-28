import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { sponsors, event_sponsors } from '@/db/schema-extensions'
import { eq, ilike, desc, count, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const per_page = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20')))

    // Simple list mode for dropdowns
    const all = searchParams.get('all')
    if (all === 'true') {
      const rows = await db.select({ id: sponsors.id, name: sponsors.name }).from(sponsors).where(eq(sponsors.is_active, true)).orderBy(sponsors.name)
      return NextResponse.json({ data: rows })
    }

    const conditions = [eq(sponsors.is_active, true)]
    if (search) {
      conditions.push(ilike(sponsors.name, `%${search}%`))
    }

    const whereClause = conditions.length > 1
      ? sql`${conditions.map((c, i) => i === 0 ? c : sql` AND ${c}`).reduce((a, b) => sql`${a}${b}`)}`
      : conditions[0]

    const [totalResult] = await db.select({ total: count() }).from(sponsors).where(whereClause)
    const total = totalResult.total

    const rows = await db
      .select()
      .from(sponsors)
      .where(whereClause)
      .orderBy(desc(sponsors.created_at))
      .limit(per_page)
      .offset((page - 1) * per_page)

    // Get event counts for each sponsor
    const sponsorIds = rows.map(r => r.id)
    const eventCounts = sponsorIds.length > 0
      ? await db.select({ sponsor_id: event_sponsors.sponsor_id, count: count() }).from(event_sponsors)
          .where(sql`${event_sponsors.sponsor_id} IN (${sql.join(sponsorIds.map(id => sql`${id}`), sql`, `)})`)
          .groupBy(event_sponsors.sponsor_id)
      : []
    const countMap = Object.fromEntries(eventCounts.map(e => [e.sponsor_id, e.count]))

    return NextResponse.json({
      data: rows.map(r => ({ ...r, event_count: countMap[r.id] || 0 })),
      meta: { total, page, per_page },
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
    if (!hasPermission(session, 'events', 'create')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { name, contact_name, email, phone, website, logo_path, industry, notes } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const [sponsor] = await db.insert(sponsors).values({
      name: name.trim(),
      contact_name: contact_name || null,
      email: email || null,
      phone: phone || null,
      website: website || null,
      logo_path: logo_path || null,
      industry: industry || null,
      notes: notes || null,
    }).returning()

    return NextResponse.json({ data: sponsor }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
