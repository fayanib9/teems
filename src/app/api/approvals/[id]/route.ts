import { NextRequest, NextResponse } from 'next/server'
import { getSession, requirePermission } from '@/lib/auth'
import { db } from '@/db'
import { approvals, approval_steps, users } from '@/db/schema'
import { eq, asc, and } from 'drizzle-orm'

// GET approval detail with steps
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const [approval] = await db.select().from(approvals).where(eq(approvals.id, Number(id)))
  if (!approval) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const steps = await db
    .select({
      id: approval_steps.id,
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
    .where(eq(approval_steps.approval_id, Number(id)))
    .orderBy(asc(approval_steps.step_order))

  return NextResponse.json({ ...approval, steps })
}

// PATCH — approve or reject a step
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { action, comment } = body // action: 'approve' | 'reject'

  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Find the current user's pending step
  const steps = await db
    .select()
    .from(approval_steps)
    .where(eq(approval_steps.approval_id, Number(id)))
    .orderBy(asc(approval_steps.step_order))

  const myStep = steps.find(s => s.approver_id === session.id && s.status === 'pending')
  if (!myStep) {
    return NextResponse.json({ error: 'No pending step for you' }, { status: 403 })
  }

  // Check if previous steps are all approved (sequential approval)
  const previousSteps = steps.filter(s => s.step_order < myStep.step_order)
  const allPreviousApproved = previousSteps.every(s => s.status === 'approved')
  if (!allPreviousApproved) {
    return NextResponse.json({ error: 'Previous approvals not yet complete' }, { status: 400 })
  }

  // Update the step
  const newStatus = action === 'approve' ? 'approved' : 'rejected'
  await db.update(approval_steps).set({
    status: newStatus,
    comment: comment || null,
    decided_at: new Date(),
  }).where(eq(approval_steps.id, myStep.id))

  // Update the overall approval status
  if (action === 'reject') {
    await db.update(approvals).set({
      status: 'rejected',
      resolved_at: new Date(),
      updated_at: new Date(),
    }).where(eq(approvals.id, Number(id)))
  } else {
    // Check if all steps are now approved
    const remainingPending = steps.filter(s => s.id !== myStep.id && s.status === 'pending')
    if (remainingPending.length === 0) {
      await db.update(approvals).set({
        status: 'approved',
        resolved_at: new Date(),
        updated_at: new Date(),
      }).where(eq(approvals.id, Number(id)))
    } else {
      await db.update(approvals).set({
        status: 'in_review',
        updated_at: new Date(),
      }).where(eq(approvals.id, Number(id)))
    }
  }

  return NextResponse.json({ success: true })
}

// DELETE — cancel an approval (only requester or admin)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const [approval] = await db.select().from(approvals).where(eq(approvals.id, Number(id)))
  if (!approval) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (approval.requested_by !== session.id && session.role_name !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.update(approvals).set({
    status: 'cancelled',
    resolved_at: new Date(),
    updated_at: new Date(),
  }).where(eq(approvals.id, Number(id)))

  return NextResponse.json({ success: true })
}
