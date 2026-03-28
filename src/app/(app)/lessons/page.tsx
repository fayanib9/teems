import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { lessons_learned, users, events } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { LessonsRepoClient } from './lessons-repo-client'

export default async function LessonsRepoPage() {
  const session = await getSession()
  if (!session) return null

  const lessons = await db
    .select({
      id: lessons_learned.id,
      event_id: lessons_learned.event_id,
      category: lessons_learned.category,
      title: lessons_learned.title,
      description: lessons_learned.description,
      impact: lessons_learned.impact,
      recommendation: lessons_learned.recommendation,
      created_by: lessons_learned.created_by,
      created_at: lessons_learned.created_at,
      author_first_name: users.first_name,
      author_last_name: users.last_name,
      event_title: events.title,
    })
    .from(lessons_learned)
    .leftJoin(users, eq(lessons_learned.created_by, users.id))
    .leftJoin(events, eq(lessons_learned.event_id, events.id))
    .orderBy(desc(lessons_learned.created_at))

  const eventList = await db
    .select({ id: events.id, title: events.title })
    .from(events)
    .orderBy(desc(events.created_at))
    .limit(50)

  return <LessonsRepoClient lessons={lessons} events={eventList} />
}
