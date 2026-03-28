import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { plan_rules } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const [rule] = await db.select().from(plan_rules).where(eq(plan_rules.id, parseInt(id))).limit(1)
  if (!rule) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ...rule, condition: JSON.parse(rule.condition), actions: JSON.parse(rule.actions) })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = { updated_at: new Date() }
  if (body.name) updates.name = body.name
  if (body.description !== undefined) updates.description = body.description
  if (body.category) updates.category = body.category
  if (body.condition) updates.condition = JSON.stringify(body.condition)
  if (body.actions) updates.actions = JSON.stringify(body.actions)
  if (body.priority !== undefined) updates.priority = body.priority
  if (body.is_active !== undefined) updates.is_active = body.is_active

  await db.update(plan_rules).set(updates).where(eq(plan_rules.id, parseInt(id)))
  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await db.update(plan_rules).set({ is_active: false, updated_at: new Date() }).where(eq(plan_rules.id, parseInt(id)))
  return NextResponse.json({ success: true })
}
