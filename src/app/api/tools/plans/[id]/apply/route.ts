import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { generated_plans, generated_plan_tasks, tasks } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const planId = parseInt(id)
    if (isNaN(planId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const body = await req.json()
    const { event_id } = body
    if (!event_id) return NextResponse.json({ error: 'event_id is required' }, { status: 400 })

    // Fetch plan
    const [plan] = await db.select().from(generated_plans).where(eq(generated_plans.id, planId)).limit(1)
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

    // Fetch generated plan tasks
    const planTasks = await db
      .select()
      .from(generated_plan_tasks)
      .where(eq(generated_plan_tasks.plan_id, planId))
      .orderBy(generated_plan_tasks.phase_order, generated_plan_tasks.sort_order)

    if (planTasks.length === 0) {
      return NextResponse.json({ error: 'Plan has no tasks to apply' }, { status: 400 })
    }

    // Create real tasks from generated plan tasks
    const newTasks = await db.insert(tasks).values(
      planTasks
        .filter(t => !t.is_optional)
        .map(t => ({
          event_id: Number(event_id),
          title: t.task_name,
          description: t.description || `Phase: ${t.phase_name}${t.role ? ` | Role: ${t.role}` : ''}`,
          status: 'todo' as const,
          priority: t.is_critical_path ? ('high' as const) : ('medium' as const),
          due_date: t.end_date,
          start_date: t.start_date,
          estimated_hours: t.duration_days * 8,
          sort_order: t.sort_order,
          created_by: session.id,
        }))
    ).returning({ id: tasks.id })

    // Update plan status and link to event
    await db.update(generated_plans).set({
      status: 'active',
      event_id: Number(event_id),
      updated_at: new Date(),
    }).where(eq(generated_plans.id, planId))

    return NextResponse.json({
      success: true,
      tasks_created: newTasks.length,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
