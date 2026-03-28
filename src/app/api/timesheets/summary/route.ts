import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { events, users } from '@/db/schema'
import { timesheets } from '@/db/schema-extensions'
import { eq, and, gte, lte, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = req.nextUrl.searchParams
    const userId = url.get('user_id')
    const dateFrom = url.get('date_from')
    const dateTo = url.get('date_to')

    const conditions = []

    // Default to current user unless they have permission to view others
    if (userId && hasPermission(session, 'timesheets', 'view')) {
      conditions.push(eq(timesheets.user_id, parseInt(userId)))
    } else {
      conditions.push(eq(timesheets.user_id, session.id))
    }

    if (dateFrom) conditions.push(gte(timesheets.date, new Date(dateFrom)))
    if (dateTo) conditions.push(lte(timesheets.date, new Date(dateTo)))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    // Total hours
    const [totalResult] = await db
      .select({
        total_minutes: sql<number>`coalesce(sum(${timesheets.hours}), 0)`,
        billable_minutes: sql<number>`coalesce(sum(case when ${timesheets.billable} = true then ${timesheets.hours} else 0 end), 0)`,
        entry_count: sql<number>`count(*)`,
      })
      .from(timesheets)
      .where(where)

    // Hours by event
    const byEvent = await db
      .select({
        event_id: timesheets.event_id,
        event_title: events.title,
        total_minutes: sql<number>`coalesce(sum(${timesheets.hours}), 0)`,
        billable_minutes: sql<number>`coalesce(sum(case when ${timesheets.billable} = true then ${timesheets.hours} else 0 end), 0)`,
        entry_count: sql<number>`count(*)`,
      })
      .from(timesheets)
      .leftJoin(events, eq(timesheets.event_id, events.id))
      .where(where)
      .groupBy(timesheets.event_id, events.title)

    // Hours by week (ISO week)
    const byWeek = await db
      .select({
        week_start: sql<string>`date_trunc('week', ${timesheets.date})::date`,
        total_minutes: sql<number>`coalesce(sum(${timesheets.hours}), 0)`,
        billable_minutes: sql<number>`coalesce(sum(case when ${timesheets.billable} = true then ${timesheets.hours} else 0 end), 0)`,
        entry_count: sql<number>`count(*)`,
      })
      .from(timesheets)
      .where(where)
      .groupBy(sql`date_trunc('week', ${timesheets.date})`)
      .orderBy(sql`date_trunc('week', ${timesheets.date})`)

    // Hours by status
    const byStatus = await db
      .select({
        status: timesheets.status,
        total_minutes: sql<number>`coalesce(sum(${timesheets.hours}), 0)`,
        entry_count: sql<number>`count(*)`,
      })
      .from(timesheets)
      .where(where)
      .groupBy(timesheets.status)

    return NextResponse.json({
      data: {
        totals: {
          total_minutes: Number(totalResult.total_minutes),
          billable_minutes: Number(totalResult.billable_minutes),
          total_hours: Math.round(Number(totalResult.total_minutes) / 60 * 10) / 10,
          billable_hours: Math.round(Number(totalResult.billable_minutes) / 60 * 10) / 10,
          entry_count: Number(totalResult.entry_count),
        },
        by_event: byEvent.map(r => ({
          ...r,
          total_minutes: Number(r.total_minutes),
          billable_minutes: Number(r.billable_minutes),
          total_hours: Math.round(Number(r.total_minutes) / 60 * 10) / 10,
          entry_count: Number(r.entry_count),
        })),
        by_week: byWeek.map(r => ({
          ...r,
          total_minutes: Number(r.total_minutes),
          billable_minutes: Number(r.billable_minutes),
          total_hours: Math.round(Number(r.total_minutes) / 60 * 10) / 10,
          entry_count: Number(r.entry_count),
        })),
        by_status: byStatus.map(r => ({
          ...r,
          total_minutes: Number(r.total_minutes),
          total_hours: Math.round(Number(r.total_minutes) / 60 * 10) / 10,
          entry_count: Number(r.entry_count),
        })),
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
