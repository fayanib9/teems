import { NextRequest, NextResponse } from 'next/server'
import { getSession, requirePermission } from '@/lib/auth'
import { db } from '@/db'
import { documents, events, users } from '@/db/schema'
import { eq, desc, and, ilike, sql } from 'drizzle-orm'
import { logActivity } from '@/lib/activity'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('event_id')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const conditions = [eq(documents.is_archived, false)]
    if (eventId) conditions.push(eq(documents.event_id, Number(eventId)))
    if (category) conditions.push(eq(documents.category, category))
    if (search) conditions.push(ilike(documents.title, `%${search}%`))

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
      .where(and(...conditions))
      .orderBy(desc(documents.created_at))

    return NextResponse.json(rows)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    requirePermission(session, 'documents', 'create')

    const body = await req.json()
    const { title, description, file_path, file_name, file_size, mime_type, category, event_id } = body

    if (!title?.trim() || !file_path) {
      return NextResponse.json({ error: 'Title and file are required' }, { status: 400 })
    }

    const [doc] = await db.insert(documents).values({
      title: title.trim(),
      description: description || null,
      file_path,
      file_name,
      file_size,
      mime_type,
      category: category || 'other',
      event_id: event_id ? Number(event_id) : null,
      uploaded_by: session.id,
    }).returning()

    logActivity({ userId: session.id, action: 'created', resource: 'document', resourceId: doc.id, eventId: doc.event_id, details: JSON.stringify({ title: doc.title }) }).catch(() => {})

    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
