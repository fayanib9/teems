import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { events, event_types, clients, tasks, risk_assessments } from '@/db/schema'
import { eq, ne, sql, count, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all active (non-archived) events with task counts
    const rows = await db
      .select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        status: events.status,
        priority: events.priority,
        start_date: events.start_date,
        end_date: events.end_date,
        budget_estimated: events.budget_estimated,
        budget_actual: events.budget_actual,
        event_type_name: event_types.name,
        client_name: clients.name,
      })
      .from(events)
      .leftJoin(event_types, eq(events.event_type_id, event_types.id))
      .leftJoin(clients, eq(events.client_id, clients.id))
      .where(ne(events.status, 'archived'))
      .orderBy(events.start_date)

    // Get task counts per event
    const taskCounts = await db
      .select({
        event_id: tasks.event_id,
        total: count(),
        done: sql<number>`count(*) filter (where ${tasks.status} = 'done')`,
        overdue: sql<number>`count(*) filter (where ${tasks.due_date} < now() and ${tasks.status} not in ('done', 'cancelled'))`,
      })
      .from(tasks)
      .groupBy(tasks.event_id)

    const taskMap = new Map(taskCounts.map(t => [t.event_id, t]))

    // Get risk levels per event
    const riskRows = await db
      .select({
        event_id: risk_assessments.event_id,
        overall_risk_level: risk_assessments.overall_risk_level,
      })
      .from(risk_assessments)

    const riskMap = new Map<number, string>()
    for (const r of riskRows) {
      if (r.event_id) {
        const existing = riskMap.get(r.event_id)
        const severity = { low: 0, medium: 1, high: 2, critical: 3 } as Record<string, number>
        if (!existing || (severity[r.overall_risk_level] ?? 0) > (severity[existing] ?? 0)) {
          riskMap.set(r.event_id, r.overall_risk_level)
        }
      }
    }

    // Calculate RAG for each event
    const portfolio = rows.map(event => {
      const tc = taskMap.get(event.id) || { total: 0, done: 0, overdue: 0 }
      const riskLevel = riskMap.get(event.id) || 'low'
      const budgetUsed = event.budget_estimated && event.budget_actual
        ? (event.budget_actual / event.budget_estimated) * 100
        : 0
      const deadlinePassed = event.end_date ? new Date(event.end_date) < new Date() && event.status !== 'completed' : false

      let rag: 'green' | 'amber' | 'red' = 'green'

      // Red conditions
      if (deadlinePassed || riskLevel === 'critical' || event.status === 'cancelled') {
        rag = 'red'
      }
      // Amber conditions
      else if (
        Number(tc.overdue) > 0 ||
        budgetUsed > 80 ||
        riskLevel === 'high' ||
        event.status === 'postponed'
      ) {
        rag = 'amber'
      }

      return {
        ...event,
        task_total: Number(tc.total),
        task_done: Number(tc.done),
        task_overdue: Number(tc.overdue),
        risk_level: riskLevel,
        budget_used_pct: Math.round(budgetUsed),
        rag,
      }
    })

    // Summary cards
    const summary = {
      total: portfolio.length,
      on_track: portfolio.filter(p => p.rag === 'green').length,
      at_risk: portfolio.filter(p => p.rag === 'amber').length,
      critical: portfolio.filter(p => p.rag === 'red').length,
      over_budget: portfolio.filter(p => p.budget_used_pct > 100).length,
    }

    return NextResponse.json({ data: portfolio, summary })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
