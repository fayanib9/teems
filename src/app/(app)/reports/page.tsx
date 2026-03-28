import { getSession, hasPermission } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { events } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { ReportsClient } from './reports-client'

export default async function ReportsPage() {
  const session = await getSession()
  if (!session) return null
  if (!hasPermission(session, 'reports', 'view')) redirect('/dashboard')

  // Fetch event list for the event selector dropdown
  const eventList = await db
    .select({
      id: events.id,
      title: events.title,
      status: events.status,
    })
    .from(events)
    .orderBy(sql`${events.start_date} DESC`)

  return (
    <ReportsClient
      events={eventList.map((e) => ({
        id: e.id,
        title: e.title,
        status: e.status,
      }))}
    />
  )
}
