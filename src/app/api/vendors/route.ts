import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { vendors, event_vendors } from '@/db/schema'
import { eq, ilike, or, desc, count, sql } from 'drizzle-orm'
import { z } from 'zod'

const createVendorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  category: z.string().optional().nullable(),
  contact_name: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  tax_number: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
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
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'vendors', 'create')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = createVendorSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message, details: parsed.error.issues }, { status: 400 })
    }
    const data = parsed.data

    const [vendor] = await db.insert(vendors).values({
      name: data.name,
      category: data.category || null,
      contact_name: data.contact_name || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      website: data.website || null,
      tax_number: data.tax_number || null,
      notes: data.notes || null,
    }).returning()

    return NextResponse.json({ data: vendor }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
