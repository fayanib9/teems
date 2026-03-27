import { NextRequest, NextResponse } from 'next/server'
import { getSession, requirePermission } from '@/lib/auth'
import { db } from '@/db'
import { approvals, approval_steps, events, users } from '@/db/schema'
import { eq, desc, and, count } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')
  const status = searchParams.get('status')
  const myPending = searchParams.get('my_pending')

  const conditions = []
  if (eventId) conditions.push(eq(approvals.event_id, Number(eventId)))
  if (status) conditions.push(eq(approvals.status, status))

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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(approvals.created_at))

  // If requesting "my pending" approvals, filter those where user is a pending approver
  if (myPending === 'true') {
    const mySteps = await db
      .select({ approval_id: approval_steps.approval_id })
      .from(approval_steps)
      .where(and(eq(approval_steps.approver_id, session.id), eq(approval_steps.status, 'pending')))

    const myApprovalIds = new Set(mySteps.map(s => s.approval_id))
    const filtered = rows.filter(r => myApprovalIds.has(r.id))
    return NextResponse.json(filtered)
  }

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  requirePermission(session, 'approvals', 'create')

  const body = await req.json()
  const { title, description, type, event_id, approver_ids } = body

  if (!title?.trim() || !type) {
    return NextResponse.json({ error: 'Title and type are required' }, { status: 400 })
  }
  if (!approver_ids || !Array.isArray(approver_ids) || approver_ids.length === 0) {
    return NextResponse.json({ error: 'At least one approver is required' }, { status: 400 })
  }

  const [approval] = await db.insert(approvals).values({
    title: title.trim(),
    description: description || null,
    type,
    event_id: event_id ? Number(event_id) : null,
    requested_by: session.id,
    status: 'pending',
  }).returning()

  // Create approval steps in order
  for (let i = 0; i < approver_ids.length; i++) {
    await db.insert(approval_steps).values({
      approval_id: approval.id,
      step_order: i + 1,
      approver_id: Number(approver_ids[i]),
      status: 'pending',
    })
  }

  return NextResponse.json(approval, { status: 201 })
}
