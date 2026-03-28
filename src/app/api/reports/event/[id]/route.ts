import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { events, tasks, event_vendors, vendors, time_entries, risk_assessments, lessons_learned, event_assignments, users } from '@/db/schema'
import { expenses, attendees, event_feedback, vendor_ratings, timesheets } from '@/db/schema-extensions'
import { eq, sql, count, sum, avg, and } from 'drizzle-orm'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = Number(id)

    // Event details
    const eventRows = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!eventRows[0]) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    const event = eventRows[0]

    // Task completion %
    const taskStats = await db
      .select({
        total: count(),
        completed: count(sql`CASE WHEN ${tasks.status} = 'done' THEN 1 END`),
      })
      .from(tasks)
      .where(eq(tasks.event_id, eventId))

    const totalTasks = taskStats[0]?.total ?? 0
    const completedTasks = taskStats[0]?.completed ?? 0
    const taskCompletionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Budget: estimated vs actual from expenses
    const expenseTotal = await db
      .select({
        total_spent: sum(expenses.amount),
        expense_count: count(),
      })
      .from(expenses)
      .where(eq(expenses.event_id, eventId))

    const budgetEstimated = event.budget_estimated ?? 0
    const budgetActual = Number(expenseTotal[0]?.total_spent ?? 0)
    const budgetVariance = budgetEstimated - budgetActual

    // Team utilization — hours logged via timesheets
    const teamHours = await db
      .select({
        user_id: timesheets.user_id,
        first_name: users.first_name,
        last_name: users.last_name,
        total_minutes: sum(timesheets.hours),
      })
      .from(timesheets)
      .innerJoin(users, eq(timesheets.user_id, users.id))
      .where(eq(timesheets.event_id, eventId))
      .groupBy(timesheets.user_id, users.first_name, users.last_name)

    const totalLoggedMinutes = teamHours.reduce((acc, h) => acc + Number(h.total_minutes ?? 0), 0)

    // Vendor status summary
    const vendorSummary = await db
      .select({
        status: event_vendors.status,
        count: count(),
      })
      .from(event_vendors)
      .where(eq(event_vendors.event_id, eventId))
      .groupBy(event_vendors.status)

    // Attendee stats
    const attendeeStats = await db
      .select({
        total: count(),
        registered: count(sql`CASE WHEN ${attendees.status} IN ('registered', 'confirmed') THEN 1 END`),
        checked_in: count(sql`CASE WHEN ${attendees.status} = 'checked_in' THEN 1 END`),
        cancelled: count(sql`CASE WHEN ${attendees.status} = 'cancelled' THEN 1 END`),
        no_show: count(sql`CASE WHEN ${attendees.status} = 'no_show' THEN 1 END`),
      })
      .from(attendees)
      .where(eq(attendees.event_id, eventId))

    // Risk count
    const riskCount = await db
      .select({ count: count() })
      .from(risk_assessments)
      .where(eq(risk_assessments.event_id, eventId))

    // Lessons learned count
    const lessonsCount = await db
      .select({ count: count() })
      .from(lessons_learned)
      .where(eq(lessons_learned.event_id, eventId))

    // Feedback summary
    const feedbackSummary = await db
      .select({
        avg_nps: avg(event_feedback.nps_score),
        avg_rating: avg(event_feedback.overall_rating),
        response_count: count(),
      })
      .from(event_feedback)
      .where(eq(event_feedback.event_id, eventId))

    return NextResponse.json({
      data: {
        event: {
          id: event.id,
          title: event.title,
          status: event.status,
          start_date: event.start_date,
          end_date: event.end_date,
          venue_name: event.venue_name,
          health_score: event.health_score,
          expected_attendees: event.expected_attendees,
        },
        task_completion: {
          total: totalTasks,
          completed: completedTasks,
          percentage: taskCompletionPct,
        },
        budget: {
          estimated: budgetEstimated,
          actual: budgetActual,
          variance: budgetVariance,
          expense_count: expenseTotal[0]?.expense_count ?? 0,
        },
        team_utilization: {
          total_hours: Math.round(totalLoggedMinutes / 60),
          members: teamHours.map((h) => ({
            user_id: h.user_id,
            name: `${h.first_name} ${h.last_name}`,
            hours: Math.round(Number(h.total_minutes ?? 0) / 60),
          })),
        },
        vendor_summary: vendorSummary,
        attendee_stats: {
          total: attendeeStats[0]?.total ?? 0,
          registered: attendeeStats[0]?.registered ?? 0,
          checked_in: attendeeStats[0]?.checked_in ?? 0,
          cancelled: attendeeStats[0]?.cancelled ?? 0,
          no_show: attendeeStats[0]?.no_show ?? 0,
        },
        risk_count: riskCount[0]?.count ?? 0,
        lessons_learned_count: lessonsCount[0]?.count ?? 0,
        feedback: {
          avg_nps: Number(feedbackSummary[0]?.avg_nps ?? 0),
          avg_rating: Number(feedbackSummary[0]?.avg_rating ?? 0),
          response_count: feedbackSummary[0]?.response_count ?? 0,
        },
      },
    })
  } catch (error) {
    console.error('Event report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
