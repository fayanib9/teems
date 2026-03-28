import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { attendees } from '@/db/schema-extensions'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const numId = parseInt(id)
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const [attendee] = await db.select().from(attendees).where(eq(attendees.id, numId))
    if (!attendee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ data: attendee })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const numId = parseInt(id)
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const body = await req.json()
    const updateData: Record<string, unknown> = { updated_at: new Date() }

    const fields = [
      'first_name', 'last_name', 'email', 'phone', 'organization', 'title',
      'registration_type', 'dietary_requirements', 'accessibility_needs',
      'badge_printed', 'notes',
    ]
    for (const f of fields) {
      if (f in body) updateData[f] = body[f]
    }

    // Handle check-in
    if (body.status === 'checked_in') {
      updateData.status = 'checked_in'
      updateData.checked_in_at = new Date()
      updateData.checked_in_by = session.id
    } else if ('status' in body) {
      updateData.status = body.status
    }

    const [updated] = await db.update(attendees).set(updateData).where(eq(attendees.id, numId)).returning()
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

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
    if (!hasPermission(session, 'events', 'edit')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const numId = parseInt(id)
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const [updated] = await db.update(attendees).set({ status: 'cancelled', updated_at: new Date() }).where(eq(attendees.id, numId)).returning()
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
