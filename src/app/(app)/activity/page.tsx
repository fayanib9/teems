import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { activity_logs, users, events } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { timeAgo, getInitials } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'

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
    .limit(100)

  return (
    <div>
      <PageHeader
        title="Activity Log"
        description="Recent actions across the platform"
      />

      <div className="space-y-1">
        {rows.length === 0 && (
          <p className="text-sm text-text-tertiary py-8 text-center">No activity recorded yet.</p>
        )}

        {rows.map((log) => {
          const initials =
            log.user_first_name && log.user_last_name
              ? getInitials(log.user_first_name, log.user_last_name)
              : '??'
          const userName =
            log.user_first_name && log.user_last_name
              ? `${log.user_first_name} ${log.user_last_name}`
              : 'Unknown user'

          return (
            <div
              key={log.id}
              className="flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-surface-secondary transition-colors"
            >
              {/* Avatar */}
              <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 font-medium text-xs flex items-center justify-center shrink-0 mt-0.5">
                {initials}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-primary">
                  <span className="font-medium">{userName}</span>{' '}
                  <span className="text-text-secondary">
                    {log.action} a {log.resource}
                  </span>
                  {log.details && (
                    <span className="text-text-tertiary"> — {log.details}</span>
                  )}
                </p>

                <div className="flex items-center gap-3 mt-0.5">
                  {log.event_title && log.event_slug && (
                    <Link
                      href={`/events/${log.event_id}`}
                      className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      {log.event_title}
                    </Link>
                  )}
                  <span className="text-xs text-text-tertiary">
                    {log.created_at ? timeAgo(log.created_at) : '—'}
                  </span>
                </div>
              </div>

              {/* Resource badge */}
              <span className="text-[11px] font-medium text-text-tertiary bg-surface-tertiary px-2 py-0.5 rounded capitalize shrink-0">
                {log.resource}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
