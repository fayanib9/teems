import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { vendors, event_vendors } from '@/db/schema'
import { eq, ilike, or, desc, count, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session, 'vendors', 'view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const all = req.nextUrl.searchParams.get('all')
  if (all === 'true') {
    const rows = await db.select({ id: vendors.id, name: vendors.name }).from(vendors).where(eq(vendors.is_active, true)).orderBy(vendors.name)
    return NextResponse.json({ data: rows })
  }

  const rows = await db.select().from(vendors).where(eq(vendors.is_active, true)).orderBy(desc(vendors.created_at))

  const vendorIds = rows.map(r => r.id)
  const eventCounts = vendorIds.length > 0
    ? await db.select({ vendor_id: event_vendors.vendor_id, count: count() }).from(event_vendors)
        .where(sql`${event_vendors.vendor_id} IN (${sql.join(vendorIds.map(id => sql`${id}`), sql`, `)})`)
        .groupBy(event_vendors.vendor_id)
    : []
  const countMap = Object.fromEntries(eventCounts.map(e => [e.vendor_id, e.count]))

  return NextResponse.json({ data: rows.map(r => ({ ...r, event_count: countMap[r.id] || 0 })) })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session, 'vendors', 'create')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  if (!body.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const [vendor] = await db.insert(vendors).values({
    name: body.name,
    category: body.category || null,
    contact_name: body.contact_name || null,
    email: body.email || null,
    phone: body.phone || null,
    address: body.address || null,
    website: body.website || null,
    tax_number: body.tax_number || null,
    notes: body.notes || null,
  }).returning()

  return NextResponse.json({ data: vendor }, { status: 201 })
}
