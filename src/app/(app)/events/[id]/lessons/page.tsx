import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { lessons_learned, users, events } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { LessonsClient } from './lessons-client'

export default async function EventLessonsPage({ params }: { params: Promise<{ id: string }> }) {
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

  const lessons = await db
    .select({
      id: lessons_learned.id,
      category: lessons_learned.category,
      title: lessons_learned.title,
      description: lessons_learned.description,
      impact: lessons_learned.impact,
      recommendation: lessons_learned.recommendation,
      created_by: lessons_learned.created_by,
      created_at: lessons_learned.created_at,
      author_first_name: users.first_name,
      author_last_name: users.last_name,
    })
    .from(lessons_learned)
    .leftJoin(users, eq(lessons_learned.created_by, users.id))
    .where(eq(lessons_learned.event_id, eventId))
    .orderBy(desc(lessons_learned.created_at))

  return (
    <LessonsClient
      eventId={eventId}
      eventTitle={event.title}
      lessons={lessons}
    />
  )
}
