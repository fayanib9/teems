import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { speakers, event_speakers } from '@/db/schema'
import { eq, desc, count, sql } from 'drizzle-orm'
import { DirectoryPage } from '@/components/directory/directory-page'

export default async function SpeakersPage() {
  const session = await getSession()
  if (!session) return null

  const rows = await db.select().from(speakers).where(eq(speakers.is_active, true)).orderBy(desc(speakers.created_at))
  const ids = rows.map(r => r.id)
  const eventCounts = ids.length > 0
    ? await db.select({ speaker_id: event_speakers.speaker_id, count: count() }).from(event_speakers)
        .where(sql`${event_speakers.speaker_id} IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`)
        .groupBy(event_speakers.speaker_id)
    : []
  const countMap = Object.fromEntries(eventCounts.map(e => [e.speaker_id, e.count]))
  const data = rows.map(r => ({ ...r, event_count: countMap[r.id] || 0 }))

  return (
    <DirectoryPage
      title="Speakers"
      iconName="Mic"
      items={data}
      apiPath="/api/speakers"
      canCreate={hasPermission(session, 'speakers', 'create')}
      canEdit={hasPermission(session, 'speakers', 'edit')}
      canDelete={hasPermission(session, 'speakers', 'delete')}
      fields={[
        { key: 'name', label: 'Full Name' },
        { key: 'title', label: 'Title / Position' },
        { key: 'organization', label: 'Organization' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone' },
        { key: 'website', label: 'Website' },
        { key: 'bio', label: 'Bio', type: 'textarea' },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ]}
      cardFields={[
        { key: 'name', style: 'title' },
        { key: 'title', style: 'subtitle' },
        { key: 'organization', style: 'caption' },
      ]}
    />
  )
}
