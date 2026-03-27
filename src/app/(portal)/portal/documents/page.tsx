import { getSession } from '@/lib/auth'
import { db } from '@/db'
import {
  documents, events, users, clients, vendors, speakers, exhibitors,
  event_vendors, event_speakers, event_exhibitors,
} from '@/db/schema'
import { eq, and, sql, desc, inArray } from 'drizzle-orm'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { FileText, Download, File } from 'lucide-react'

export default async function PortalDocumentsPage() {
  const session = await getSession()
  if (!session) return null

  const role = session.role_name
  const eventIds = await getEventIdsForUser(role, session.id)

  let docs: DocRow[] = []
  if (eventIds.length > 0) {
    docs = await db
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
        created_at: documents.created_at,
        event_title: events.title,
      })
      .from(documents)
      .leftJoin(events, eq(documents.event_id, events.id))
      .where(and(
        eq(documents.is_archived, false),
        sql`${documents.event_id} IN (${sql.join(eventIds.map(id => sql`${id}`), sql`, `)})`
      ))
      .orderBy(desc(documents.created_at))
  }

  return (
    <>
      <PageHeader
        title="Documents"
        description="Documents associated with your events"
      />

      {docs.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <FileText className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No documents found.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">Document</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {docs.map(doc => (
                  <tr key={doc.id} className="hover:bg-surface-secondary/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="shrink-0 h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center">
                          <File className="h-4 w-4 text-primary-500" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{doc.title}</p>
                          <p className="text-xs text-text-tertiary">{doc.file_name} {doc.file_size ? `(${formatFileSize(doc.file_size)})` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{doc.event_title || '—'}</td>
                    <td className="px-4 py-3">
                      {doc.category ? <Badge color="blue">{doc.category}</Badge> : <span className="text-text-tertiary">—</span>}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{formatDate(doc.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/api/files/${doc.file_path}`}
                        className="inline-flex items-center gap-1 text-primary-500 hover:text-primary-600 text-xs font-medium"
                        download
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

async function getEventIdsForUser(role: string, userId: number): Promise<number[]> {
  if (role === 'client') {
    const [client] = await db.select({ id: clients.id }).from(clients).where(eq(clients.user_id, userId)).limit(1)
    if (!client) return []
    const rows = await db.select({ id: events.id }).from(events).where(eq(events.client_id, client.id))
    return rows.map(r => r.id)
  }
  if (role === 'vendor') {
    const [vendor] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.user_id, userId)).limit(1)
    if (!vendor) return []
    const rows = await db.select({ event_id: event_vendors.event_id }).from(event_vendors).where(eq(event_vendors.vendor_id, vendor.id))
    return rows.map(r => r.event_id)
  }
  if (role === 'speaker') {
    const [speaker] = await db.select({ id: speakers.id }).from(speakers).where(eq(speakers.user_id, userId)).limit(1)
    if (!speaker) return []
    const rows = await db.select({ event_id: event_speakers.event_id }).from(event_speakers).where(eq(event_speakers.speaker_id, speaker.id))
    return rows.map(r => r.event_id)
  }
  if (role === 'exhibitor') {
    const [exhibitor] = await db.select({ id: exhibitors.id }).from(exhibitors).where(eq(exhibitors.user_id, userId)).limit(1)
    if (!exhibitor) return []
    const rows = await db.select({ event_id: event_exhibitors.event_id }).from(event_exhibitors).where(eq(event_exhibitors.exhibitor_id, exhibitor.id))
    return rows.map(r => r.event_id)
  }
  return []
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type DocRow = {
  id: number
  title: string
  description: string | null
  file_path: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  category: string | null
  version: number | null
  event_id: number | null
  created_at: Date | null
  event_title: string | null
}
