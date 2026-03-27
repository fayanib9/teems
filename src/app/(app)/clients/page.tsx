import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { clients, events } from '@/db/schema'
import { eq, desc, count, sql } from 'drizzle-orm'
import { ClientsListClient } from './clients-list-client'

export default async function ClientsPage() {
  const session = await getSession()
  if (!session) return null

  const rows = await db
    .select()
    .from(clients)
    .where(eq(clients.is_active, true))
    .orderBy(desc(clients.created_at))

  // Get event counts per client
  const clientIds = rows.map(r => r.id)
  const eventCounts = clientIds.length > 0
    ? await db
        .select({ client_id: events.client_id, count: count() })
        .from(events)
        .where(sql`${events.client_id} IN (${sql.join(clientIds.map(id => sql`${id}`), sql`, `)})`)
        .groupBy(events.client_id)
    : []

  const countMap = Object.fromEntries(eventCounts.map(e => [e.client_id!, e.count]))
  const data = rows.map(r => ({ ...r, event_count: countMap[r.id] || 0 }))

  const canCreate = hasPermission(session, 'clients', 'create')
  const canEdit = hasPermission(session, 'clients', 'edit')
  const canDelete = hasPermission(session, 'clients', 'delete')

  return (
    <ClientsListClient
      clients={data}
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  )
}
