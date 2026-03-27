import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { events, tasks, approvals } from '@/db/schema'
import { eq, and, sql, count } from 'drizzle-orm'
import { PageHeader } from '@/components/layout/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { CalendarDays, CheckSquare, ClipboardCheck, Users, AlertTriangle, Clock } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return null

  const [eventStats] = await db
    .select({ count: count() })
    .from(events)
    .where(eq(events.status, 'in_progress'))

  const [taskStats] = await db
    .select({ count: count() })
    .from(tasks)
    .where(eq(tasks.assigned_to, session.id))

  const [tasksDue] = await db
    .select({ count: count() })
    .from(tasks)
    .where(
      and(
        eq(tasks.assigned_to, session.id),
        eq(tasks.status, 'todo'),
        sql`${tasks.due_date} <= NOW() + INTERVAL '3 days'`
      )
    )

  const [pendingApprovals] = await db
    .select({ count: count() })
    .from(approvals)
    .where(eq(approvals.status, 'pending'))

  const [totalEvents] = await db
    .select({ count: count() })
    .from(events)

  const isExecutive = ['super_admin', 'admin', 'executive'].includes(session.role_name)

  return (
    <>
      <PageHeader
        title={`Welcome back, ${session.first_name}`}
        description={isExecutive ? 'Executive overview of all operations' : 'Here\'s what needs your attention today'}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active Events"
          value={eventStats.count}
          icon={CalendarDays}
        />
        <StatCard
          title="My Tasks"
          value={taskStats.count}
          icon={CheckSquare}
        />
        <StatCard
          title="Due Soon"
          value={tasksDue.count}
          icon={Clock}
        />
        <StatCard
          title="Pending Approvals"
          value={pendingApprovals.count}
          icon={ClipboardCheck}
        />
      </div>

      {isExecutive && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <StatCard
            title="Total Events"
            value={totalEvents.count}
            subtitle="All time"
            icon={CalendarDays}
          />
          <StatCard
            title="Overview"
            value="—"
            subtitle="More dashboard widgets coming soon"
            icon={AlertTriangle}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold text-text-primary mb-4">Recent Events</h2>
          <p className="text-sm text-text-secondary">Events will appear here once created.</p>
        </div>

        {/* My Tasks */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-base font-semibold text-text-primary mb-4">My Tasks</h2>
          <p className="text-sm text-text-secondary">Your assigned tasks will appear here.</p>
        </div>
      </div>
    </>
  )
}
