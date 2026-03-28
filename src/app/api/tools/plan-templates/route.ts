import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { plan_templates, plan_template_phases, plan_template_tasks } from '@/db/schema'
import { desc, eq, asc } from 'drizzle-orm'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const templates = await db
    .select()
    .from(plan_templates)
    .orderBy(desc(plan_templates.created_at))

  // Get phase/task counts
  const result = []
  for (const t of templates) {
    const phases = await db.select().from(plan_template_phases).where(eq(plan_template_phases.template_id, t.id))
    let taskCount = 0
    for (const p of phases) {
      const tasks = await db.select().from(plan_template_tasks).where(eq(plan_template_tasks.phase_id, p.id))
      taskCount += tasks.length
    }
    result.push({ ...t, phase_count: phases.length, task_count: taskCount })
  }

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const [template] = await db.insert(plan_templates).values({
    name: body.name,
    description: body.description || null,
    event_type: body.event_type || null,
    min_attendees: body.min_attendees || null,
    max_attendees: body.max_attendees || null,
    is_default: body.is_default || false,
  }).returning()

  return NextResponse.json(template, { status: 201 })
}
