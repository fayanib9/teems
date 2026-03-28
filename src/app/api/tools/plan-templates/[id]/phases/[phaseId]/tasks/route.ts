import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { plan_template_tasks } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { phaseId } = await params
  const tasks = await db.select().from(plan_template_tasks).where(eq(plan_template_tasks.phase_id, parseInt(phaseId))).orderBy(asc(plan_template_tasks.sort_order))
  return NextResponse.json(tasks)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { phaseId } = await params
  const body = await request.json()

  const [task] = await db.insert(plan_template_tasks).values({
    phase_id: parseInt(phaseId),
    name: body.name,
    duration_days: body.duration_days || 5,
    role: body.role || null,
    is_optional: body.is_optional || false,
    dependencies: body.dependencies ? JSON.stringify(body.dependencies) : null,
    sort_order: body.sort_order || 99,
    description: body.description || null,
  }).returning()

  return NextResponse.json(task, { status: 201 })
}
