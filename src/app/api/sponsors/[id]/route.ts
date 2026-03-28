import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { sponsors, event_sponsors } from '@/db/schema-extensions'
import { events } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const numId = parseInt(id)
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const [sponsor] = await db.select().from(sponsors).where(eq(sponsors.id, numId))
    if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Fetch event history for this sponsor
    const eventHistory = await db
      .select({
        id: event_sponsors.id,
        event_id: event_sponsors.event_id,
        event_title: events.title,
        event_start_date: events.start_date,
        tier: event_sponsors.tier,
        commitment_amount: event_sponsors.commitment_amount,
        paid_amount: event_sponsors.paid_amount,
        status: event_sponsors.status,
        created_at: event_sponsors.created_at,
      })
      .from(event_sponsors)
      .innerJoin(events, eq(event_sponsors.event_id, events.id))
      .where(eq(event_sponsors.sponsor_id, numId))

    return NextResponse.json({ data: { ...sponsor, event_history: eventHistory } })
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
    const fields = ['name', 'contact_name', 'email', 'phone', 'website', 'logo_path', 'industry', 'notes']
    for (const f of fields) { if (f in body) updateData[f] = body[f] }

    const [updated] = await db.update(sponsors).set(updateData).where(eq(sponsors.id, numId)).returning()
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

    await db.update(sponsors).set({ is_active: false, updated_at: new Date() }).where(eq(sponsors.id, numId))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
