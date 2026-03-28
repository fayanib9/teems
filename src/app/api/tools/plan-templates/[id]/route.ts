import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { plan_templates, plan_template_phases, plan_template_tasks } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const templateId = parseInt(id)

  const [template] = await db.select().from(plan_templates).where(eq(plan_templates.id, templateId)).limit(1)
  if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const phases = await db.select().from(plan_template_phases).where(eq(plan_template_phases.template_id, templateId)).orderBy(asc(plan_template_phases.sort_order))

  const phasesWithTasks = []
  for (const phase of phases) {
    const tasks = await db.select().from(plan_template_tasks).where(eq(plan_template_tasks.phase_id, phase.id)).orderBy(asc(plan_template_tasks.sort_order))
    phasesWithTasks.push({ ...phase, tasks })
  }

  return NextResponse.json({ ...template, phases: phasesWithTasks })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  await db.update(plan_templates).set({
    name: body.name,
    description: body.description,
    event_type: body.event_type,
    min_attendees: body.min_attendees,
    max_attendees: body.max_attendees,
    is_default: body.is_default,
    updated_at: new Date(),
  }).where(eq(plan_templates.id, parseInt(id)))

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await db.update(plan_templates).set({ is_active: false, updated_at: new Date() }).where(eq(plan_templates.id, parseInt(id)))
  return NextResponse.json({ success: true })
}
