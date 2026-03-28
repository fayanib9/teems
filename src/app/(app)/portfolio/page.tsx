import { getSession, hasPermission } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { events, event_types, clients, tasks, risk_assessments } from '@/db/schema'
import { eq, ne, sql, count } from 'drizzle-orm'
import { PortfolioClient } from './portfolio-client'

export default async function PortfolioPage() {
  const session = await getSession()
  if (!session) return null
  if (!hasPermission(session, 'events', 'view')) redirect('/dashboard')

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

  const portfolio = rows.map(event => {
    const tc = taskMap.get(event.id) || { total: 0, done: 0, overdue: 0 }
    const riskLevel = riskMap.get(event.id) || 'low'
    const budgetUsed = event.budget_estimated && event.budget_actual
      ? (event.budget_actual / event.budget_estimated) * 100
      : 0
    const deadlinePassed = event.end_date ? new Date(event.end_date) < new Date() && event.status !== 'completed' : false

    let rag: 'green' | 'amber' | 'red' = 'green'
    if (deadlinePassed || riskLevel === 'critical' || event.status === 'cancelled') {
      rag = 'red'
    } else if (Number(tc.overdue) > 0 || budgetUsed > 80 || riskLevel === 'high' || event.status === 'postponed') {
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

  // Calculate KPIs
  const totalEstimated = portfolio.reduce((s, p) => s + (p.budget_estimated || 0), 0)
  const totalActual = portfolio.reduce((s, p) => s + (p.budget_actual || 0), 0)
  const totalTasks = portfolio.reduce((s, p) => s + p.task_total, 0)
  const totalTasksDone = portfolio.reduce((s, p) => s + p.task_done, 0)
  const totalOverdue = portfolio.reduce((s, p) => s + p.task_overdue, 0)
  const completedEvents = portfolio.filter(p => p.status === 'completed')
  const onTimeDelivery = completedEvents.length > 0
    ? Math.round((completedEvents.filter(e => e.end_date && new Date(e.end_date) >= new Date()).length / completedEvents.length) * 100)
    : 100
  const taskCompletionRate = totalTasks > 0 ? Math.round((totalTasksDone / totalTasks) * 100) : 0
  const budgetVariancePct = totalEstimated > 0 ? Math.round(((totalActual - totalEstimated) / totalEstimated) * 100) : 0

  const summary = {
    total: portfolio.length,
    on_track: portfolio.filter(p => p.rag === 'green').length,
    at_risk: portfolio.filter(p => p.rag === 'amber').length,
    critical: portfolio.filter(p => p.rag === 'red').length,
    over_budget: portfolio.filter(p => p.budget_used_pct > 100).length,
  }

  const kpis = {
    totalEstimated,
    totalActual,
    budgetVariancePct,
    taskCompletionRate,
    onTimeDelivery,
    totalOverdue,
    activeEvents: portfolio.filter(p => ['planning', 'confirmed', 'in_progress'].includes(p.status)).length,
    completedEvents: completedEvents.length,
  }

  return <PortfolioClient portfolio={portfolio} summary={summary} kpis={kpis} />
}
