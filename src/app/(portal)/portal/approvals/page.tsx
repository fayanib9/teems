import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { approvals, approval_steps, events, users, clients } from '@/db/schema'
import { eq, and, desc, asc, sql } from 'drizzle-orm'
import { PageHeader } from '@/components/layout/page-header'
import { ApprovalsClient } from './approvals-client'

export default async function PortalApprovalsPage() {
  const session = await getSession()
  if (!session) return null

  if (session.role_name !== 'client') {
    return (
      <>
        <PageHeader title="Approvals" description="This section is not available for your role" />
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-text-secondary">Approvals are only available for client accounts.</p>
        </div>
      </>
    )
  }

  // Find the client record for this user
  const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.user_id, session.id)).limit(1)
  if (!client) {
    return (
      <>
        <PageHeader title="Approvals" />
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-text-secondary">No client profile linked to your account.</p>
        </div>
      </>
    )
  }

  // Get events for this client
  const clientEvents = await db.select({ id: events.id }).from(events).where(eq(events.client_id, client.id))
  const eventIds = clientEvents.map(e => e.id)

  if (eventIds.length === 0) {
    return (
      <>
        <PageHeader title="Approvals" description="Pending approvals for your events" />
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-text-secondary">No approvals found.</p>
        </div>
      </>
    )
  }

  const rows = await db
    .select({
      id: approvals.id,
      title: approvals.title,
      description: approvals.description,
      type: approvals.type,
      status: approvals.status,
      event_id: approvals.event_id,
      created_at: approvals.created_at,
      resolved_at: approvals.resolved_at,
      event_title: events.title,
      requester_first: users.first_name,
      requester_last: users.last_name,
    })
    .from(approvals)
    .leftJoin(events, eq(approvals.event_id, events.id))
    .leftJoin(users, eq(approvals.requested_by, users.id))
    .where(sql`${approvals.event_id} IN (${sql.join(eventIds.map(id => sql`${id}`), sql`, `)})`)
    .orderBy(desc(approvals.created_at))

  // Get steps for these approvals
  const approvalIds = rows.map(r => r.id)
  let allSteps: StepRow[] = []
  if (approvalIds.length > 0) {
    allSteps = await db
      .select({
        id: approval_steps.id,
        approval_id: approval_steps.approval_id,
        step_order: approval_steps.step_order,
        approver_id: approval_steps.approver_id,
        status: approval_steps.status,
        comment: approval_steps.comment,
        decided_at: approval_steps.decided_at,
        approver_first: users.first_name,
        approver_last: users.last_name,
      })
      .from(approval_steps)
      .leftJoin(users, eq(approval_steps.approver_id, users.id))
      .where(sql`${approval_steps.approval_id} IN (${sql.join(approvalIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(asc(approval_steps.step_order))
  }

  const stepsByApproval: Record<number, typeof allSteps> = {}
  for (const step of allSteps) {
    if (!stepsByApproval[step.approval_id]) stepsByApproval[step.approval_id] = []
    stepsByApproval[step.approval_id].push(step)
  }

  const data = rows.map(r => ({
    ...r,
    created_at: r.created_at?.toISOString() ?? null,
    resolved_at: r.resolved_at?.toISOString() ?? null,
    steps: (stepsByApproval[r.id] || []).map(s => ({
      ...s,
      decided_at: s.decided_at?.toISOString() ?? null,
    })),
  }))

  return <ApprovalsClient approvals={data} currentUserId={session.id} />
}

type StepRow = {
  id: number
  approval_id: number
  step_order: number
  approver_id: number
  status: string | null
  comment: string | null
  decided_at: Date | null
  approver_first: string | null
  approver_last: string | null
}
