import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import {
  clients, events, approvals, approval_steps, users,
} from '@/db/schema'
import { eq, and, inArray, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role_name !== 'client') {
      return NextResponse.json({ error: 'Forbidden — client role required' }, { status: 403 })
    }

    const clientRecord = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.user_id, session.id))
      .limit(1)

    if (!clientRecord[0]) return NextResponse.json({ error: 'No linked client record' }, { status: 404 })

    const eventRows = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.client_id, clientRecord[0].id))

    const eventIds = eventRows.map(e => e.id)
    if (eventIds.length === 0) return NextResponse.json({ data: [] })

    const approvalRows = await db
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
      .where(inArray(approvals.event_id, eventIds))
      .orderBy(desc(approvals.created_at))

    // Fetch steps for each approval
    const approvalIds = approvalRows.map(a => a.id)
    const steps = approvalIds.length > 0
      ? await db
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
          .where(inArray(approval_steps.approval_id, approvalIds))
      : []

    const stepsMap = new Map<number, typeof steps>()
    for (const step of steps) {
      const list = stepsMap.get(step.approval_id) || []
      list.push(step)
      stepsMap.set(step.approval_id, list)
    }

    const data = approvalRows.map(a => ({
      ...a,
      steps: stepsMap.get(a.id) || [],
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role_name !== 'client') {
      return NextResponse.json({ error: 'Forbidden — client role required' }, { status: 403 })
    }

    const body = await req.json()
    const { step_id, action, comment } = body as {
      step_id: number
      action: 'approved' | 'rejected'
      comment?: string
    }

    if (!step_id || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'step_id and action (approved|rejected) required' }, { status: 400 })
    }

    // Verify the step belongs to the user
    const step = await db
      .select({
        id: approval_steps.id,
        approval_id: approval_steps.approval_id,
        approver_id: approval_steps.approver_id,
        status: approval_steps.status,
      })
      .from(approval_steps)
      .where(eq(approval_steps.id, step_id))
      .limit(1)

    if (!step[0]) return NextResponse.json({ error: 'Approval step not found' }, { status: 404 })
    if (step[0].approver_id !== session.id) {
      return NextResponse.json({ error: 'This approval step is not assigned to you' }, { status: 403 })
    }
    if (step[0].status !== 'pending') {
      return NextResponse.json({ error: 'This step has already been decided' }, { status: 400 })
    }

    // Verify the approval belongs to one of the client's events
    const approval = await db
      .select({ event_id: approvals.event_id })
      .from(approvals)
      .where(eq(approvals.id, step[0].approval_id))
      .limit(1)

    if (!approval[0]) return NextResponse.json({ error: 'Approval not found' }, { status: 404 })

    const clientRecord = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.user_id, session.id))
      .limit(1)

    if (!clientRecord[0]) return NextResponse.json({ error: 'No linked client record' }, { status: 404 })

    if (approval[0].event_id) {
      const event = await db
        .select({ client_id: events.client_id })
        .from(events)
        .where(eq(events.id, approval[0].event_id))
        .limit(1)

      if (!event[0] || event[0].client_id !== clientRecord[0].id) {
        return NextResponse.json({ error: 'You do not have access to this approval' }, { status: 403 })
      }
    }

    // Update the step
    await db
      .update(approval_steps)
      .set({
        status: action,
        comment: comment || null,
        decided_at: new Date(),
      })
      .where(eq(approval_steps.id, step_id))

    // Check if all steps are resolved — update parent approval status
    const allSteps = await db
      .select({ status: approval_steps.status })
      .from(approval_steps)
      .where(eq(approval_steps.approval_id, step[0].approval_id))

    const allDecided = allSteps.every(s => s.status !== 'pending')
    if (allDecided) {
      const anyRejected = allSteps.some(s => s.status === 'rejected')
      await db
        .update(approvals)
        .set({
          status: anyRejected ? 'rejected' : 'approved',
          resolved_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(approvals.id, step[0].approval_id))
    }

    return NextResponse.json({ success: true, step_id, action })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
