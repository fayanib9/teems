import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { speakers, vendors, exhibitors, clients, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

const EXTERNAL_ROLES = ['client', 'vendor', 'speaker', 'exhibitor']

const ALLOWED_FIELDS: Record<string, string[]> = {
  speaker: ['bio', 'title', 'organization', 'photo_path', 'website', 'social_links'],
  exhibitor: ['contact_name', 'website', 'industry', 'notes', 'logo_path'],
  vendor: ['contact_name', 'website', 'category', 'address', 'notes', 'logo_path'],
  client: ['contact_name', 'website', 'address', 'city', 'country', 'notes', 'logo_path'],
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!EXTERNAL_ROLES.includes(session.role_name)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const role = session.role_name

    if (role === 'speaker') {
      const record = await db.select().from(speakers).where(eq(speakers.user_id, session.id)).limit(1)
      if (!record[0]) return NextResponse.json({ error: 'No linked speaker record' }, { status: 404 })
      return NextResponse.json({ data: record[0], role })
    }

    if (role === 'exhibitor') {
      const record = await db.select().from(exhibitors).where(eq(exhibitors.user_id, session.id)).limit(1)
      if (!record[0]) return NextResponse.json({ error: 'No linked exhibitor record' }, { status: 404 })
      return NextResponse.json({ data: record[0], role })
    }

    if (role === 'vendor') {
      const record = await db.select().from(vendors).where(eq(vendors.user_id, session.id)).limit(1)
      if (!record[0]) return NextResponse.json({ error: 'No linked vendor record' }, { status: 404 })
      return NextResponse.json({ data: record[0], role })
    }

    if (role === 'client') {
      const record = await db.select().from(clients).where(eq(clients.user_id, session.id)).limit(1)
      if (!record[0]) return NextResponse.json({ error: 'No linked client record' }, { status: 404 })
      return NextResponse.json({ data: record[0], role })
    }

    return NextResponse.json({ error: 'Unknown role' }, { status: 400 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!EXTERNAL_ROLES.includes(session.role_name)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const role = session.role_name
    const body = await req.json()
    const allowedFields = ALLOWED_FIELDS[role] || []
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    updates.updated_at = new Date()

    if (role === 'speaker') {
      const record = await db.select({ id: speakers.id }).from(speakers).where(eq(speakers.user_id, session.id)).limit(1)
      if (!record[0]) return NextResponse.json({ error: 'No linked speaker record' }, { status: 404 })
      await db.update(speakers).set(updates).where(eq(speakers.id, record[0].id))
      const updated = await db.select().from(speakers).where(eq(speakers.id, record[0].id)).limit(1)
      return NextResponse.json({ data: updated[0] })
    }

    if (role === 'exhibitor') {
      const record = await db.select({ id: exhibitors.id }).from(exhibitors).where(eq(exhibitors.user_id, session.id)).limit(1)
      if (!record[0]) return NextResponse.json({ error: 'No linked exhibitor record' }, { status: 404 })
      await db.update(exhibitors).set(updates).where(eq(exhibitors.id, record[0].id))
      const updated = await db.select().from(exhibitors).where(eq(exhibitors.id, record[0].id)).limit(1)
      return NextResponse.json({ data: updated[0] })
    }

    if (role === 'vendor') {
      const record = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.user_id, session.id)).limit(1)
      if (!record[0]) return NextResponse.json({ error: 'No linked vendor record' }, { status: 404 })
      await db.update(vendors).set(updates).where(eq(vendors.id, record[0].id))
      const updated = await db.select().from(vendors).where(eq(vendors.id, record[0].id)).limit(1)
      return NextResponse.json({ data: updated[0] })
    }

    if (role === 'client') {
      const record = await db.select({ id: clients.id }).from(clients).where(eq(clients.user_id, session.id)).limit(1)
      if (!record[0]) return NextResponse.json({ error: 'No linked client record' }, { status: 404 })
      await db.update(clients).set(updates).where(eq(clients.id, record[0].id))
      const updated = await db.select().from(clients).where(eq(clients.id, record[0].id)).limit(1)
      return NextResponse.json({ data: updated[0] })
    }

    return NextResponse.json({ error: 'Unknown role' }, { status: 400 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
