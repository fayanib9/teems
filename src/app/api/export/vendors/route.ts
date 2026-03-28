import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { vendors, event_vendors } from '@/db/schema'
import { eq, sql, count } from 'drizzle-orm'
import { toCSV, csvResponse } from '@/lib/export'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return new Response('Unauthorized', { status: 401 })
    if (!hasPermission(session, 'vendors', 'view')) {
      return new Response('Forbidden', { status: 403 })
    }

    const rows = await db
      .select({
        name: vendors.name,
        category: vendors.category,
        contact_name: vendors.contact_name,
        email: vendors.email,
        phone: vendors.phone,
        address: vendors.address,
        rating: vendors.rating,
        total_events: count(event_vendors.id),
      })
      .from(vendors)
      .leftJoin(event_vendors, eq(vendors.id, event_vendors.vendor_id))
      .where(eq(vendors.is_active, true))
      .groupBy(
        vendors.id,
        vendors.name,
        vendors.category,
        vendors.contact_name,
        vendors.email,
        vendors.phone,
        vendors.address,
        vendors.rating,
      )

    const headers = [
      'Company Name', 'Category', 'Contact Person', 'Email',
      'Phone', 'Address', 'Rating', 'Total Events',
    ]

    const csvRows = rows.map((r) => [
      r.name,
      r.category,
      r.contact_name,
      r.email,
      r.phone,
      r.address,
      r.rating,
      r.total_events,
    ])

    const today = new Date().toISOString().split('T')[0]
    return csvResponse(toCSV(headers, csvRows), `teems_vendors_${today}.csv`)
  } catch {
    return new Response('Internal Server Error', { status: 500 })
  }
}
