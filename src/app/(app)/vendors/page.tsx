import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { vendors, event_vendors } from '@/db/schema'
import { eq, desc, count, sql } from 'drizzle-orm'
import { DirectoryPage } from '@/components/directory/directory-page'
import { VENDOR_CATEGORIES } from '@/lib/constants'

export default async function VendorsPage() {
  const session = await getSession()
  if (!session) return null

  const rows = await db.select().from(vendors).where(eq(vendors.is_active, true)).orderBy(desc(vendors.created_at))
  const vendorIds = rows.map(r => r.id)
  const eventCounts = vendorIds.length > 0
    ? await db.select({ vendor_id: event_vendors.vendor_id, count: count() }).from(event_vendors)
        .where(sql`${event_vendors.vendor_id} IN (${sql.join(vendorIds.map(id => sql`${id}`), sql`, `)})`)
        .groupBy(event_vendors.vendor_id)
    : []
  const countMap = Object.fromEntries(eventCounts.map(e => [e.vendor_id, e.count]))
  const data = rows.map(r => ({ ...r, event_count: countMap[r.id] || 0 }))

  return (
    <DirectoryPage
      title="Vendors"
      iconName="Truck"
      items={data}
      apiPath="/api/vendors"
      canCreate={hasPermission(session, 'vendors', 'create')}
      canEdit={hasPermission(session, 'vendors', 'edit')}
      canDelete={hasPermission(session, 'vendors', 'delete')}
      fields={[
        { key: 'name', label: 'Company Name' },
        { key: 'category', label: 'Category', options: VENDOR_CATEGORIES.map(c => ({ value: c, label: c.replace(/_/g, ' ').replace(/^\w/, s => s.toUpperCase()) })) },
        { key: 'contact_name', label: 'Contact Person' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone' },
        { key: 'website', label: 'Website' },
        { key: 'tax_number', label: 'Tax Number' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      cardFields={[
        { key: 'name', style: 'title' },
        { key: 'category', style: 'caption', transform: 'replace_underscores' },
        { key: 'contact_name', style: 'subtitle' },
      ]}
    />
  )
}
