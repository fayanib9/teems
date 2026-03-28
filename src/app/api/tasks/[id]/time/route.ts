import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { time_entries, users, tasks } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const taskId = parseInt(id)

    const rows = await db
      .select({
        id: time_entries.id,
        hours: time_entries.hours,
        description: time_entries.description,
        date: time_entries.date,
        created_at: time_entries.created_at,
        user_first_name: users.first_name,
        user_last_name: users.last_name,
      })
      .from(time_entries)
      .leftJoin(users, eq(time_entries.user_id, users.id))
      .where(eq(time_entries.task_id, taskId))
      .orderBy(desc(time_entries.date))

    // Sum total logged hours (stored as minutes)
    const [totalResult] = await db
      .select({ total: sql<number>`coalesce(sum(${time_entries.hours}), 0)` })
      .from(time_entries)
      .where(eq(time_entries.task_id, taskId))

    return NextResponse.json({
      data: rows,
      total_minutes: Number(totalResult.total),
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

    const { id } = await params
    const taskId = parseInt(id)
    const body = await req.json()
    const { hours, description, date } = body

    if (!hours || !date) {
      return NextResponse.json({ error: 'Hours and date are required' }, { status: 400 })
    }

    // Store hours as minutes for precision
    const minutes = Math.round(parseFloat(hours) * 60)

    const [entry] = await db.insert(time_entries).values({
      task_id: taskId,
      user_id: session.id,
      hours: minutes,
      description: description || null,
      date: new Date(date),
    }).returning()

    // Update actual_hours on the task (sum of all time entries in hours)
    const [sumResult] = await db
      .select({ total: sql<number>`coalesce(sum(${time_entries.hours}), 0)` })
      .from(time_entries)
      .where(eq(time_entries.task_id, taskId))

    await db
      .update(tasks)
      .set({ actual_hours: Math.round(Number(sumResult.total) / 60) })
      .where(eq(tasks.id, taskId))

    return NextResponse.json({ data: entry }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
