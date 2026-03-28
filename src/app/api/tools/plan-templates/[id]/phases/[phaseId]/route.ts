import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { plan_template_phases } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { phaseId } = await params
  const body = await request.json()

  await db.update(plan_template_phases).set({
    name: body.name,
    sort_order: body.sort_order,
    color: body.color,
    icon: body.icon,
  }).where(eq(plan_template_phases.id, parseInt(phaseId)))

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { phaseId } = await params
  await db.delete(plan_template_phases).where(eq(plan_template_phases.id, parseInt(phaseId)))
  return NextResponse.json({ success: true })
}
