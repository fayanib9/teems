import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { attendees } from '@/db/schema-extensions'
import { eq, and, like, sql, desc, count } from 'drizzle-orm'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const createAttendeeSchema = z.object({
  event_id: z.number().int().positive('Event ID is required'),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Valid email is required').max(255),
  phone: z.string().max(30).optional().nullable(),
  organization: z.string().max(200).optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  registration_type: z.enum(['general', 'vip', 'speaker', 'exhibitor', 'media', 'staff']).optional().default('general'),
  dietary_requirements: z.string().optional().nullable(),
  accessibility_needs: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const searchParams = req.nextUrl.searchParams
    const event_id = searchParams.get('event_id')
    if (!event_id) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
    }

    const eventId = parseInt(event_id)
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event_id' }, { status: 400 })
    }

    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const per_page = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '25')))
    const offset = (page - 1) * per_page

    const conditions = [eq(attendees.event_id, eventId)]

    if (status) {
      conditions.push(eq(attendees.status, status))
    }

    if (search) {
      const pattern = `%${search}%`
      conditions.push(
        sql`(${like(attendees.first_name, pattern)} OR ${like(attendees.last_name, pattern)} OR ${like(attendees.email, pattern)} OR ${like(attendees.organization, pattern)})`
      )
    }

    const where = and(...conditions)

    const [totalResult] = await db.select({ total: count() }).from(attendees).where(where)
    const rows = await db.select().from(attendees).where(where).orderBy(desc(attendees.created_at)).limit(per_page).offset(offset)

    return NextResponse.json({
      data: rows,
      meta: {
        total: totalResult.total,
        page,
        per_page,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const parsed = createAttendeeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message, details: parsed.error.issues }, { status: 400 })
    }
    const data = parsed.data

    const [attendee] = await db.insert(attendees).values({
      event_id: data.event_id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone || null,
      organization: data.organization || null,
      title: data.title || null,
      registration_type: data.registration_type,
      dietary_requirements: data.dietary_requirements || null,
      accessibility_needs: data.accessibility_needs || null,
      notes: data.notes || null,
      qr_code: randomUUID(),
    }).returning()

    return NextResponse.json({ data: attendee }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
