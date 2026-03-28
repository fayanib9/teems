import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { events, tasks, users, event_assignments, event_vendors, time_entries } from '@/db/schema'
import { expenses, attendees, event_feedback, vendor_ratings, timesheets } from '@/db/schema-extensions'
import { sql, eq, count, sum, avg, and, lt, ne, isNotNull } from 'drizzle-orm'

export async function GET(_req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Events by status
    const eventsByStatus = await db
      .select({
        status: events.status,
        count: count(),
      })
      .from(events)
      .groupBy(events.status)

    const totalEvents = eventsByStatus.reduce((acc, e) => acc + e.count, 0)

    // Revenue pipeline (budget_estimated totals by status)
    const revenuePipeline = await db
      .select({
        status: events.status,
        total_budget: sum(events.budget_estimated),
      })
      .from(events)
      .groupBy(events.status)

    // Task completion rates
    const taskStats = await db
      .select({
        total: count(),
        completed: count(sql`CASE WHEN ${tasks.status} = 'done' THEN 1 END`),
      })
      .from(tasks)

    const totalTasks = taskStats[0]?.total ?? 0
    const completedTasks = taskStats[0]?.completed ?? 0
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Overdue tasks
    const overdueResult = await db
      .select({ count: count() })
      .from(tasks)
      .where(
        and(
          lt(tasks.due_date, new Date()),
          ne(tasks.status, 'done')
        )
      )
    const overdueTasks = overdueResult[0]?.count ?? 0

    // Resource utilization — total hours logged via timesheets
    const utilizationResult = await db
      .select({
        total_minutes: sum(timesheets.hours),
        user_count: count(sql`DISTINCT ${timesheets.user_id}`),
      })
      .from(timesheets)

    const totalMinutes = Number(utilizationResult[0]?.total_minutes ?? 0)
    const activeUsers = Number(utilizationResult[0]?.user_count ?? 0)
    const avgHoursPerUser = activeUsers > 0 ? Math.round((totalMinutes / 60 / activeUsers) * 10) / 10 : 0

    // Vendor performance averages
    const vendorPerf = await db
      .select({
        avg_quality: avg(vendor_ratings.quality_rating),
        avg_timeliness: avg(vendor_ratings.timeliness_rating),
        avg_communication: avg(vendor_ratings.communication_rating),
        avg_value: avg(vendor_ratings.value_rating),
        avg_overall: avg(vendor_ratings.overall_rating),
        total_ratings: count(),
      })
      .from(vendor_ratings)

    // Client satisfaction — avg NPS from feedback
    const npsResult = await db
      .select({
        avg_nps: avg(event_feedback.nps_score),
        avg_overall_rating: avg(event_feedback.overall_rating),
        total_responses: count(),
      })
      .from(event_feedback)
      .where(isNotNull(event_feedback.nps_score))

    // Budget totals
    const budgetTotals = await db
      .select({
        total_estimated: sum(events.budget_estimated),
        total_actual: sum(events.budget_actual),
      })
      .from(events)

    // Event list for table
    const eventList = await db
      .select({
        id: events.id,
        title: events.title,
        status: events.status,
        start_date: events.start_date,
        end_date: events.end_date,
        budget_estimated: events.budget_estimated,
        budget_actual: events.budget_actual,
        completion_percentage: events.completion_percentage,
        health_score: events.health_score,
      })
      .from(events)
      .orderBy(sql`${events.start_date} DESC`)

    return NextResponse.json({
      data: {
        events_by_status: eventsByStatus,
        total_events: totalEvents,
        revenue_pipeline: revenuePipeline,
        task_stats: {
          total: totalTasks,
          completed: completedTasks,
          completion_rate: completionRate,
          overdue: overdueTasks,
        },
        resource_utilization: {
          total_hours: Math.round(totalMinutes / 60),
          active_users: activeUsers,
          avg_hours_per_user: avgHoursPerUser,
        },
        vendor_performance: {
          avg_quality: Number(vendorPerf[0]?.avg_quality ?? 0),
          avg_timeliness: Number(vendorPerf[0]?.avg_timeliness ?? 0),
          avg_communication: Number(vendorPerf[0]?.avg_communication ?? 0),
          avg_value: Number(vendorPerf[0]?.avg_value ?? 0),
          avg_overall: Number(vendorPerf[0]?.avg_overall ?? 0),
          total_ratings: vendorPerf[0]?.total_ratings ?? 0,
        },
        client_satisfaction: {
          avg_nps: Number(npsResult[0]?.avg_nps ?? 0),
          avg_overall_rating: Number(npsResult[0]?.avg_overall_rating ?? 0),
          total_responses: npsResult[0]?.total_responses ?? 0,
        },
        budget_summary: {
          total_estimated: Number(budgetTotals[0]?.total_estimated ?? 0),
          total_actual: Number(budgetTotals[0]?.total_actual ?? 0),
          variance: Number(budgetTotals[0]?.total_estimated ?? 0) - Number(budgetTotals[0]?.total_actual ?? 0),
        },
        events: eventList,
      },
    })
  } catch (error) {
    console.error('Portfolio report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
