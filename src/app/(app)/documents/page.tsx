import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { documents, events, users } from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { DocumentsClient } from './documents-client'

export default async function DocumentsPage() {
  const session = await getSession()
  if (!session) return null

  const rows = await db
    .select({
      id: documents.id,
      title: documents.title,
      description: documents.description,
      file_path: documents.file_path,
      file_name: documents.file_name,
      file_size: documents.file_size,
      mime_type: documents.mime_type,
      category: documents.category,
      version: documents.version,
      event_id: documents.event_id,
      uploaded_by: documents.uploaded_by,
      created_at: documents.created_at,
      event_title: events.title,
      uploader_name: users.first_name,
    })
    .from(documents)
    .leftJoin(events, eq(documents.event_id, events.id))
    .leftJoin(users, eq(documents.uploaded_by, users.id))
    .where(eq(documents.is_archived, false))
    .orderBy(desc(documents.created_at))

  // Get events for the upload form dropdown
  const eventList = await db.select({ id: events.id, title: events.title }).from(events).orderBy(desc(events.created_at))

  const serializedRows = rows.map(r => ({
    ...r,
    created_at: r.created_at?.toISOString() ?? null,
  }))

  return (
    <DocumentsClient
      documents={serializedRows}
      events={eventList}
      canCreate={hasPermission(session, 'documents', 'create')}
      canEdit={hasPermission(session, 'documents', 'edit')}
      canDelete={hasPermission(session, 'documents', 'delete')}
    />
  )
}
