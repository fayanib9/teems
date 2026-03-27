import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { exhibitors } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session, 'exhibitors', 'edit')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const updateData: Record<string, unknown> = { updated_at: new Date() }
  const fields = ['name', 'contact_name', 'email', 'phone', 'website', 'industry', 'notes']
  for (const f of fields) { if (f in body) updateData[f] = body[f] }

  const [updated] = await db.update(exhibitors).set(updateData).where(eq(exhibitors.id, parseInt(id))).returning()
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session, 'exhibitors', 'delete')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  await db.update(exhibitors).set({ is_active: false, updated_at: new Date() }).where(eq(exhibitors.id, parseInt(id)))
  return NextResponse.json({ success: true })
}
