import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { approvals, approval_steps, events, users } from '@/db/schema'
import { eq, desc, asc, and } from 'drizzle-orm'
import { ApprovalsClient } from './approvals-client'

export default async function ApprovalsPage() {
  const session = await getSession()
  if (!session) return null

  const rows = await db
    .select({
      id: approvals.id,
      title: approvals.title,
      description: approvals.description,
      type: approvals.type,
      status: approvals.status,
      event_id: approvals.event_id,
      requested_by: approvals.requested_by,
      resolved_at: approvals.resolved_at,
      created_at: approvals.created_at,
      event_title: events.title,
      requester_first: users.first_name,
      requester_last: users.last_name,
    })
    .from(approvals)
    .leftJoin(events, eq(approvals.event_id, events.id))
    .leftJoin(users, eq(approvals.requested_by, users.id))
    .orderBy(desc(approvals.created_at))

  // Get steps for all approvals
  const allSteps = await db
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
    .orderBy(asc(approval_steps.step_order))

  // Group steps by approval_id
  const stepsByApproval: Record<number, typeof allSteps> = {}
  for (const step of allSteps) {
    if (!stepsByApproval[step.approval_id]) stepsByApproval[step.approval_id] = []
    stepsByApproval[step.approval_id].push(step)
  }

  const data = rows.map(r => ({
    ...r,
    resolved_at: r.resolved_at?.toISOString() ?? null,
    created_at: r.created_at?.toISOString() ?? null,
    steps: (stepsByApproval[r.id] || []).map(s => ({
      ...s,
      decided_at: s.decided_at?.toISOString() ?? null,
    })),
  }))

  // Get events and users for the create form
  const eventList = await db.select({ id: events.id, title: events.title }).from(events).orderBy(desc(events.created_at))
  const userList = await db.select({ id: users.id, first_name: users.first_name, last_name: users.last_name }).from(users).where(eq(users.is_active, true))

  return (
    <ApprovalsClient
      approvals={data}
      events={eventList}
      users={userList}
      currentUserId={session.id}
      canCreate={hasPermission(session, 'approvals', 'create')}
    />
  )
}
