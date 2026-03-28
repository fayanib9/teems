import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { tasks, task_baselines } from '@/db/schema'
import { eq, sql, max } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = parseInt(id)

    // Get latest baseline for each task
    const baselines = await db
      .select({
        task_id: task_baselines.task_id,
        baseline_start_date: task_baselines.baseline_start_date,
        baseline_end_date: task_baselines.baseline_end_date,
        baseline_number: task_baselines.baseline_number,
        created_at: task_baselines.created_at,
      })
      .from(task_baselines)
      .where(eq(task_baselines.event_id, eventId))

    // Group by task_id, keep latest baseline
    const latestBaselines = new Map<number, typeof baselines[0]>()
    for (const b of baselines) {
      const existing = latestBaselines.get(b.task_id)
      if (!existing || b.baseline_number > existing.baseline_number) {
        latestBaselines.set(b.task_id, b)
      }
    }

    // Get current task dates
    const currentTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        start_date: tasks.start_date,
        due_date: tasks.due_date,
        status: tasks.status,
      })
      .from(tasks)
      .where(eq(tasks.event_id, eventId))

    const comparison = currentTasks.map(task => {
      const baseline = latestBaselines.get(task.id)
      let variance_days: number | null = null

      if (baseline?.baseline_end_date && task.due_date) {
        const baseEnd = new Date(baseline.baseline_end_date).getTime()
        const currentEnd = new Date(task.due_date).getTime()
        variance_days = Math.round((currentEnd - baseEnd) / (1000 * 60 * 60 * 24))
      }

      return {
        task_id: task.id,
        title: task.title,
        status: task.status,
        current_start: task.start_date,
        current_end: task.due_date,
        baseline_start: baseline?.baseline_start_date || null,
        baseline_end: baseline?.baseline_end_date || null,
        baseline_number: baseline?.baseline_number || 0,
        variance_days,
      }
    })

    // Get max baseline number
    const [maxResult] = await db
      .select({ max: sql<number>`coalesce(max(${task_baselines.baseline_number}), 0)` })
      .from(task_baselines)
      .where(eq(task_baselines.event_id, eventId))

    return NextResponse.json({
      data: comparison,
      current_baseline: Number(maxResult.max),
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const eventId = parseInt(id)

    // Determine next baseline number
    const [maxResult] = await db
      .select({ max: sql<number>`coalesce(max(${task_baselines.baseline_number}), 0)` })
      .from(task_baselines)
      .where(eq(task_baselines.event_id, eventId))

    const nextBaseline = Number(maxResult.max) + 1

    // Get all tasks for this event
    const eventTasks = await db
      .select({
        id: tasks.id,
        start_date: tasks.start_date,
        due_date: tasks.due_date,
      })
      .from(tasks)
      .where(eq(tasks.event_id, eventId))

    if (eventTasks.length === 0) {
      return NextResponse.json({ error: 'No tasks to baseline' }, { status: 400 })
    }

    // Create baseline entries for all tasks
    const baselineValues = eventTasks.map(task => ({
      event_id: eventId,
      task_id: task.id,
      baseline_start_date: task.start_date,
      baseline_end_date: task.due_date,
      baseline_number: nextBaseline,
    }))

    await db.insert(task_baselines).values(baselineValues)

    return NextResponse.json({
      data: { baseline_number: nextBaseline, tasks_baselined: eventTasks.length },
    }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
