import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { events, run_sheet_items, users } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { RunSheetClient } from './run-sheet-client'

export default async function RunSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return null

  const { id } = await params
  const eventId = parseInt(id)
  if (isNaN(eventId)) notFound()

  const [event] = await db
    .select({ id: events.id, title: events.title })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1)

  if (!event) notFound()

  const items = await db
    .select({
      id: run_sheet_items.id,
      title: run_sheet_items.title,
      description: run_sheet_items.description,
      scheduled_time: run_sheet_items.scheduled_time,
      duration_minutes: run_sheet_items.duration_minutes,
      location: run_sheet_items.location,
      responsible_user_id: run_sheet_items.responsible_user_id,
      status: run_sheet_items.status,
      sort_order: run_sheet_items.sort_order,
      notes: run_sheet_items.notes,
      completed_at: run_sheet_items.completed_at,
      responsible_name: users.first_name,
    })
    .from(run_sheet_items)
    .leftJoin(users, eq(run_sheet_items.responsible_user_id, users.id))
    .where(eq(run_sheet_items.event_id, eventId))
    .orderBy(asc(run_sheet_items.sort_order), asc(run_sheet_items.scheduled_time))

  // Get users for assignment dropdown
  const allUsers = await db
    .select({ id: users.id, first_name: users.first_name, last_name: users.last_name })
    .from(users)
    .where(eq(users.is_active, true))

  return (
    <RunSheetClient
      eventId={eventId}
      eventTitle={event.title}
      initialItems={items}
      users={allUsers}
    />
  )
}
