import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { timesheets } from '@/db/schema-extensions'
import { eq, and } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const numId = parseInt(id)
    if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    // Fetch existing entry
    const [existing] = await db.select().from(timesheets).where(eq(timesheets.id, numId)).limit(1)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const updateData: Record<string, unknown> = { updated_at: new Date() }

    // Status transitions
    if (body.status) {
      const { status } = body

      if (status === 'submitted') {
        // Only the owner can submit, and only draft entries
        if (existing.user_id !== session.id) {
          return NextResponse.json({ error: 'Only the owner can submit entries' }, { status: 403 })
        }
        if (existing.status !== 'draft' && existing.status !== 'rejected') {
          return NextResponse.json({ error: 'Only draft or rejected entries can be submitted' }, { status: 400 })
        }
        updateData.status = 'submitted'
      } else if (status === 'approved') {
        if (!hasPermission(session, 'timesheets', 'approve')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        if (existing.status !== 'submitted') {
          return NextResponse.json({ error: 'Only submitted entries can be approved' }, { status: 400 })
        }
        updateData.status = 'approved'
        updateData.approved_by = session.id
        updateData.approved_at = new Date()
      } else if (status === 'rejected') {
        if (!hasPermission(session, 'timesheets', 'approve')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        if (existing.status !== 'submitted') {
          return NextResponse.json({ error: 'Only submitted entries can be rejected' }, { status: 400 })
        }
        updateData.status = 'rejected'
        updateData.approved_by = session.id
        updateData.approved_at = new Date()
      } else if (status === 'draft') {
        // Allow reverting rejected entries back to draft
        if (existing.user_id !== session.id) {
          return NextResponse.json({ error: 'Only the owner can revert entries' }, { status: 403 })
        }
        if (existing.status !== 'rejected') {
          return NextResponse.json({ error: 'Only rejected entries can be reverted to draft' }, { status: 400 })
        }
        updateData.status = 'draft'
        updateData.approved_by = null
        updateData.approved_at = null
      }
    }

    // Only allow editing draft entries for field updates
    if (!body.status || body.status === undefined) {
      if (existing.status !== 'draft') {
        return NextResponse.json({ error: 'Only draft entries can be edited' }, { status: 400 })
      }
      if (existing.user_id !== session.id) {
        return NextResponse.json({ error: 'Only the owner can edit entries' }, { status: 403 })
      }
      const fields = ['event_id', 'task_id', 'date', 'hours', 'description', 'billable']
      for (const f of fields) {
        if (f in body) {
          if (f === 'date') {
            updateData[f] = new Date(body[f])
          } else {
            updateData[f] = body[f]
          }
        }
      }
    }

    const [updated] = await db.update(timesheets).set(updateData).where(eq(timesheets.id, numId)).returning()
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const numId = parseInt(id)
    if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    // Only allow deleting draft entries owned by the user
    const [existing] = await db.select().from(timesheets).where(eq(timesheets.id, numId)).limit(1)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.user_id !== session.id) {
      return NextResponse.json({ error: 'Only the owner can delete entries' }, { status: 403 })
    }
    if (existing.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft entries can be deleted' }, { status: 400 })
    }

    await db.delete(timesheets).where(and(eq(timesheets.id, numId), eq(timesheets.status, 'draft')))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
