import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { events, tasks } from '@/db/schema'
import { expenses } from '@/db/schema-extensions'
import { eq, sql } from 'drizzle-orm'
import { calculateEVM } from '@/lib/evm'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = Number(id)

    // Fetch event
    const [event] = await db
      .select({
        budget_estimated: events.budget_estimated,
        start_date: events.start_date,
        end_date: events.end_date,
      })
      .from(events)
      .where(eq(events.id, eventId))

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!event.budget_estimated || !event.start_date || !event.end_date) {
      return NextResponse.json(
        { error: 'Event must have budget_estimated, start_date, and end_date to calculate EVM' },
        { status: 400 },
      )
    }

    // Fetch tasks for this event
    const eventTasks = await db
      .select({ status: tasks.status })
      .from(tasks)
      .where(eq(tasks.event_id, eventId))

    // Sum expenses for this event
    const [expenseTotal] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(eq(expenses.event_id, eventId))

    const metrics = calculateEVM({
      budgetAtCompletion: event.budget_estimated,
      startDate: new Date(event.start_date),
      endDate: new Date(event.end_date),
      tasks: eventTasks.map((t) => ({ status: t.status ?? 'todo' })),
      totalExpenses: Number(expenseTotal.total),
    })

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('EVM calculation error:', error)
    return NextResponse.json({ error: 'Failed to calculate EVM metrics' }, { status: 500 })
  }
}
