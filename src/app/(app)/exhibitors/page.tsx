import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { exhibitors, event_exhibitors } from '@/db/schema'
import { eq, desc, count, sql } from 'drizzle-orm'
import { DirectoryPage } from '@/components/directory/directory-page'

export default async function ExhibitorsPage() {
  const session = await getSession()
  if (!session) return null

  const rows = await db.select().from(exhibitors).where(eq(exhibitors.is_active, true)).orderBy(desc(exhibitors.created_at))
  const ids = rows.map(r => r.id)
  const eventCounts = ids.length > 0
    ? await db.select({ exhibitor_id: event_exhibitors.exhibitor_id, count: count() }).from(event_exhibitors)
        .where(sql`${event_exhibitors.exhibitor_id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`)
        .groupBy(event_exhibitors.exhibitor_id)
    : []
  const countMap = Object.fromEntries(eventCounts.map(e => [e.exhibitor_id, e.count]))
  const data = rows.map(r => ({ ...r, event_count: countMap[r.id] || 0 }))

  return (
    <DirectoryPage
      title="Exhibitors"
      iconName="Presentation"
      items={data}
      apiPath="/api/exhibitors"
      canCreate={hasPermission(session, 'exhibitors', 'create')}
      canEdit={hasPermission(session, 'exhibitors', 'edit')}
      canDelete={hasPermission(session, 'exhibitors', 'delete')}
      fields={[
        { key: 'name', label: 'Company Name' },
        { key: 'contact_name', label: 'Contact Person' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone' },
        { key: 'website', label: 'Website' },
        { key: 'industry', label: 'Industry' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      cardFields={[
        { key: 'name', style: 'title' },
        { key: 'industry', style: 'subtitle' },
        { key: 'contact_name', style: 'caption' },
      ]}
    />
  )
}
