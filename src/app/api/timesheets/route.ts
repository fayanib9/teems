import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { events, tasks, users } from '@/db/schema'
import { timesheets } from '@/db/schema-extensions'
import { eq, and, gte, lte, desc, count } from 'drizzle-orm'
import { z } from 'zod'

const createTimesheetSchema = z.object({
  event_id: z.number().int().positive().optional().nullable(),
  task_id: z.number().int().positive().optional().nullable(),
  date: z.string().min(1, 'Date is required'),
  hours: z.number().min(1, 'Hours must be at least 1 minute'), // in minutes
  description: z.string().optional().nullable(),
  billable: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = req.nextUrl.searchParams
    const page = parseInt(url.get('page') || '1')
    const limit = parseInt(url.get('limit') || '100')
    const userId = url.get('user_id')
    const eventId = url.get('event_id')
    const status = url.get('status')
    const dateFrom = url.get('date_from')
    const dateTo = url.get('date_to')

    const conditions = []

    // Default to current user's entries unless user_id is specified and user has permission
    if (userId && hasPermission(session, 'timesheets', 'view')) {
      conditions.push(eq(timesheets.user_id, parseInt(userId)))
    } else {
      conditions.push(eq(timesheets.user_id, session.id))
    }

    if (eventId) conditions.push(eq(timesheets.event_id, parseInt(eventId)))
    if (status) conditions.push(eq(timesheets.status, status))
    if (dateFrom) conditions.push(gte(timesheets.date, new Date(dateFrom)))
    if (dateTo) conditions.push(lte(timesheets.date, new Date(dateTo)))

    const where = and(...conditions)

    const [totalResult] = await db.select({ count: count() }).from(timesheets).where(where)

    const rows = await db
      .select({
        id: timesheets.id,
        user_id: timesheets.user_id,
        event_id: timesheets.event_id,
        task_id: timesheets.task_id,
        date: timesheets.date,
        hours: timesheets.hours,
        description: timesheets.description,
        billable: timesheets.billable,
        status: timesheets.status,
        approved_by: timesheets.approved_by,
        approved_at: timesheets.approved_at,
        created_at: timesheets.created_at,
        event_title: events.title,
        task_title: tasks.title,
        user_first_name: users.first_name,
        user_last_name: users.last_name,
      })
      .from(timesheets)
      .leftJoin(events, eq(timesheets.event_id, events.id))
      .leftJoin(tasks, eq(timesheets.task_id, tasks.id))
      .leftJoin(users, eq(timesheets.user_id, users.id))
      .where(where)
      .orderBy(desc(timesheets.date))
      .limit(limit)
      .offset((page - 1) * limit)

    return NextResponse.json({
      data: rows,
      pagination: { page, limit, total: totalResult.count, pages: Math.ceil(totalResult.count / limit) },
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

    const body = await req.json()
    const parsed = createTimesheetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message, details: parsed.error.issues }, { status: 400 })
    }

    const { event_id, task_id, date, hours, description, billable } = parsed.data

    const [entry] = await db.insert(timesheets).values({
      user_id: session.id,
      event_id: event_id || null,
      task_id: task_id || null,
      date: new Date(date),
      hours,
      description: description || null,
      billable: billable ?? true,
      status: 'draft',
    }).returning()

    return NextResponse.json({ data: entry }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
