import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { attendees } from '@/db/schema-extensions'
import { eq, and, or, ilike, sql, count } from 'drizzle-orm'
import crypto from 'crypto'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const page = Number(searchParams.get('page') || '1')
    const limit = Number(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const conditions = [eq(attendees.event_id, Number(id))]

    if (status) {
      conditions.push(eq(attendees.status, status))
    }

    if (search) {
      conditions.push(
        or(
          ilike(attendees.first_name, `%${search}%`),
          ilike(attendees.last_name, `%${search}%`),
          ilike(attendees.email, `%${search}%`),
          ilike(attendees.organization, `%${search}%`),
        )!
      )
    }

    const where = and(...conditions)

    const [rows, [total]] = await Promise.all([
      db
        .select()
        .from(attendees)
        .where(where)
        .orderBy(attendees.registered_at)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(attendees)
        .where(where),
    ])

    return NextResponse.json({
      attendees: rows,
      total: total.count,
      page,
      limit,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    if (!body.first_name || !body.last_name || !body.email) {
      return NextResponse.json({ error: 'first_name, last_name, and email are required' }, { status: 400 })
    }

    const [row] = await db.insert(attendees).values({
      event_id: Number(id),
      first_name: body.first_name.trim(),
      last_name: body.last_name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone || null,
      organization: body.organization || null,
      title: body.title || null,
      registration_type: body.registration_type || 'general',
      dietary_requirements: body.dietary_requirements || null,
      accessibility_needs: body.accessibility_needs || null,
      status: 'registered',
      notes: body.notes || null,
      qr_code: crypto.randomUUID(),
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
