import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { activity_logs, users, events } from '@/db/schema'
import { eq, desc, count } from 'drizzle-orm'
import { ActivityClient } from './activity-client'

export default async function ActivityPage() {
  const session = await getSession()
  if (!session) return null
  if (!hasPermission(session, 'activity', 'view')) {
    return (
      <div className="p-6">
        <p className="text-sm text-text-secondary">You do not have permission to view activity logs.</p>
      </div>
    )
  }

  const rows = await db
    .select({
      id: activity_logs.id,
      user_id: activity_logs.user_id,
      event_id: activity_logs.event_id,
      action: activity_logs.action,
      resource: activity_logs.resource,
      resource_id: activity_logs.resource_id,
      details: activity_logs.details,
      created_at: activity_logs.created_at,
      user_first_name: users.first_name,
      user_last_name: users.last_name,
      event_title: events.title,
      event_slug: events.slug,
    })
    .from(activity_logs)
    .leftJoin(users, eq(activity_logs.user_id, users.id))
    .leftJoin(events, eq(activity_logs.event_id, events.id))
    .orderBy(desc(activity_logs.created_at))
    .limit(20)

  const [totalResult] = await db.select({ count: count() }).from(activity_logs)

  // Get unique users for filter
  const activeUsers = await db
    .select({ id: users.id, first_name: users.first_name, last_name: users.last_name })
    .from(users)
    .where(eq(users.is_active, true))

  return (
    <ActivityClient
      initialLogs={rows.map(r => ({
        ...r,
        created_at: r.created_at ? r.created_at.toISOString() : null,
      }))}
      totalCount={totalResult.count}
      users={activeUsers.map(u => ({ id: u.id, name: `${u.first_name} ${u.last_name}` }))}
    />
  )
}
