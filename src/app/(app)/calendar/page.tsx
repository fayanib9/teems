import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { events, event_types } from '@/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { CalendarClient } from './calendar-client'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const session = await getSession()
  if (!session) return null

  const params = await searchParams
  const year = parseInt(params.year || String(new Date().getFullYear()))
  const month = parseInt(params.month || String(new Date().getMonth() + 1))

  // Get events for the visible range (include prev/next month overflow)
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)

  // Extend range to cover calendar grid
  const firstDay = startOfMonth.getDay() // 0=Sun
  const rangeStart = new Date(startOfMonth)
  rangeStart.setDate(rangeStart.getDate() - firstDay)
  const rangeEnd = new Date(endOfMonth)
  const remaining = 6 - endOfMonth.getDay()
  rangeEnd.setDate(rangeEnd.getDate() + remaining)

  const calendarEvents = await db
    .select({
      id: events.id,
      title: events.title,
      status: events.status,
      start_date: events.start_date,
      end_date: events.end_date,
      event_type_color: event_types.color,
    })
    .from(events)
    .leftJoin(event_types, eq(events.event_type_id, event_types.id))
    .where(
      and(
        lte(events.start_date, rangeEnd),
        gte(events.end_date, rangeStart)
      )
    )

  return (
    <CalendarClient
      events={calendarEvents}
      year={year}
      month={month}
    />
  )
}
