import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { attendees } from '@/db/schema-extensions'
import { eq, and } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; attendeeId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, attendeeId } = await params
    const body = await req.json()

    const updates: Record<string, unknown> = { updated_at: new Date() }

    if (body.first_name !== undefined) updates.first_name = body.first_name.trim()
    if (body.last_name !== undefined) updates.last_name = body.last_name.trim()
    if (body.email !== undefined) updates.email = body.email.trim().toLowerCase()
    if (body.phone !== undefined) updates.phone = body.phone || null
    if (body.organization !== undefined) updates.organization = body.organization || null
    if (body.title !== undefined) updates.title = body.title || null
    if (body.registration_type !== undefined) updates.registration_type = body.registration_type
    if (body.dietary_requirements !== undefined) updates.dietary_requirements = body.dietary_requirements || null
    if (body.accessibility_needs !== undefined) updates.accessibility_needs = body.accessibility_needs || null
    if (body.notes !== undefined) updates.notes = body.notes || null
    if (body.badge_printed !== undefined) updates.badge_printed = body.badge_printed

    // Handle status changes
    if (body.status !== undefined) {
      updates.status = body.status
    }

    // Handle check-in
    if (body.check_in === true) {
      updates.status = 'checked_in'
      updates.checked_in_at = new Date()
      updates.checked_in_by = session.id
    }

    const [row] = await db
      .update(attendees)
      .set(updates)
      .where(and(eq(attendees.id, Number(attendeeId)), eq(attendees.event_id, Number(id))))
      .returning()

    if (!row) return NextResponse.json({ error: 'Attendee not found' }, { status: 404 })

    return NextResponse.json(row)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; attendeeId: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, attendeeId } = await params

    const [row] = await db
      .update(attendees)
      .set({ status: 'cancelled', updated_at: new Date() })
      .where(and(eq(attendees.id, Number(attendeeId)), eq(attendees.event_id, Number(id))))
      .returning()

    if (!row) return NextResponse.json({ error: 'Attendee not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
