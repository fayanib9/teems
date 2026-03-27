import { NextRequest, NextResponse } from 'next/server'
import { getSession, requirePermission } from '@/lib/auth'
import { db } from '@/db'
import { documents } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  requirePermission(session, 'documents', 'edit')

  const { id } = await params
  const body = await req.json()
  const { title, description, category, event_id } = body

  const updates: Record<string, unknown> = { updated_at: new Date() }
  if (title !== undefined) updates.title = title.trim()
  if (description !== undefined) updates.description = description
  if (category !== undefined) updates.category = category
  if (event_id !== undefined) updates.event_id = event_id ? Number(event_id) : null

  const [doc] = await db.update(documents).set(updates).where(eq(documents.id, Number(id))).returning()
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(doc)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  requirePermission(session, 'documents', 'delete')

  const { id } = await params
  const [doc] = await db.update(documents).set({ is_archived: true }).where(eq(documents.id, Number(id))).returning()
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}
