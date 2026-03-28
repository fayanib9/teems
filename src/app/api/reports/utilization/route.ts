import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { events, users } from '@/db/schema'
import { timesheets } from '@/db/schema-extensions'
import { eq, sql, sum, count, and, gte, lte } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    // Build date filter conditions
    const conditions = []
    if (dateFrom) conditions.push(gte(timesheets.date, new Date(dateFrom)))
    if (dateTo) conditions.push(lte(timesheets.date, new Date(dateTo)))

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // Per-user hours breakdown
    const perUser = await db
      .select({
        user_id: timesheets.user_id,
        first_name: users.first_name,
        last_name: users.last_name,
        total_minutes: sum(timesheets.hours),
        billable_minutes: sum(sql`CASE WHEN ${timesheets.billable} = true THEN ${timesheets.hours} ELSE 0 END`),
        entry_count: count(),
      })
      .from(timesheets)
      .innerJoin(users, eq(timesheets.user_id, users.id))
      .where(whereClause)
      .groupBy(timesheets.user_id, users.first_name, users.last_name)
      .orderBy(sql`${sum(timesheets.hours)} DESC`)

    // By-event allocation
    const byEvent = await db
      .select({
        user_id: timesheets.user_id,
        first_name: users.first_name,
        last_name: users.last_name,
        event_id: timesheets.event_id,
        event_title: events.title,
        total_minutes: sum(timesheets.hours),
      })
      .from(timesheets)
      .innerJoin(users, eq(timesheets.user_id, users.id))
      .leftJoin(events, eq(timesheets.event_id, events.id))
      .where(whereClause)
      .groupBy(timesheets.user_id, users.first_name, users.last_name, timesheets.event_id, events.title)
      .orderBy(sql`${sum(timesheets.hours)} DESC`)

    // Calculate weeks in range for over-allocation detection
    let weeks = 1
    if (dateFrom && dateTo) {
      const diffMs = new Date(dateTo).getTime() - new Date(dateFrom).getTime()
      weeks = Math.max(1, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)))
    } else {
      // Default: assume 4 weeks if no range specified
      weeks = 4
    }

    // Over-allocated users (>40hrs/week average)
    const overAllocated = perUser
      .map((u) => {
        const totalHours = Math.round(Number(u.total_minutes ?? 0) / 60)
        const avgWeeklyHours = Math.round((totalHours / weeks) * 10) / 10
        return {
          user_id: u.user_id,
          name: `${u.first_name} ${u.last_name}`,
          total_hours: totalHours,
          billable_hours: Math.round(Number(u.billable_minutes ?? 0) / 60),
          avg_weekly_hours: avgWeeklyHours,
          entry_count: u.entry_count,
        }
      })
      .filter((u) => u.avg_weekly_hours > 40)

    // Format user data
    const userData = perUser.map((u) => {
      const totalHours = Math.round(Number(u.total_minutes ?? 0) / 60)
      const avgWeeklyHours = Math.round((totalHours / weeks) * 10) / 10
      return {
        user_id: u.user_id,
        name: `${u.first_name} ${u.last_name}`,
        total_hours: totalHours,
        billable_hours: Math.round(Number(u.billable_minutes ?? 0) / 60),
        avg_weekly_hours: avgWeeklyHours,
        entry_count: u.entry_count,
      }
    })

    // Format event allocation data
    const eventAllocation = byEvent.map((e) => ({
      user_id: e.user_id,
      name: `${e.first_name} ${e.last_name}`,
      event_id: e.event_id,
      event_title: e.event_title ?? 'Unassigned',
      hours: Math.round(Number(e.total_minutes ?? 0) / 60),
    }))

    return NextResponse.json({
      data: {
        date_range: {
          from: dateFrom,
          to: dateTo,
          weeks,
        },
        users: userData,
        by_event: eventAllocation,
        over_allocated: overAllocated,
      },
    })
  } catch (error) {
    console.error('Utilization report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
