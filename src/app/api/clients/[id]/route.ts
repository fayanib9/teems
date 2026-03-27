import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { clients, events } from '@/db/schema'
import { eq, count } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'clients', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const numId = parseInt(id)
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }
    const [client] = await db.select().from(clients).where(eq(clients.id, numId)).limit(1)
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const [eventCount] = await db.select({ count: count() }).from(events).where(eq(events.client_id, client.id))

    return NextResponse.json({ data: { ...client, event_count: eventCount.count } })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'clients', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const numId = parseInt(id)
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }
    const body = await req.json()

    const updateData: Record<string, unknown> = { updated_at: new Date() }
    const allowedFields = ['name', 'contact_name', 'email', 'phone', 'address', 'city', 'country', 'website', 'notes', 'is_active']
    for (const field of allowedFields) {
      if (field in body) updateData[field] = body[field]
    }

    const [updated] = await db.update(clients).set(updateData).where(eq(clients.id, numId)).returning()
    if (!updated) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

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
    if (!hasPermission(session, 'clients', 'delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const numId = parseInt(id)
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }
    // Soft delete
    const [updated] = await db.update(clients).set({ is_active: false, updated_at: new Date() }).where(eq(clients.id, numId)).returning({ id: clients.id })
    if (!updated) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
