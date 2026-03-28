import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { generated_plans, generated_plan_tasks, users } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { executeRules, generatePlan } from '@/engine/plan-generator'
import type { PlanFormData } from '@/engine/types'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const plans = await db
    .select({
      id: generated_plans.id,
      name: generated_plans.name,
      client_name: generated_plans.client_name,
      template_used: generated_plans.template_used,
      complexity_score: generated_plans.complexity_score,
      status: generated_plans.status,
      version: generated_plans.version,
      created_at: generated_plans.created_at,
    })
    .from(generated_plans)
    .orderBy(desc(generated_plans.created_at))

  return NextResponse.json(plans)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()

    const formData: PlanFormData = {
      project_name: body.project_name || '',
      client_name: body.client_name || '',
      client_id: body.client_id || undefined,
      event_id: body.event_id || undefined,
      event_type: body.event_type || 'conference',
      event_date: body.event_date || '',
      duration_days: body.duration_days || 1,
      attendees: body.attendees || 500,
      audience_type: body.audience_type || 'public',
      venue_type: body.venue_type || 'indoor',
      zones_count: body.zones_count || 1,
      services: body.services || [],
      budget_range: body.budget_range || '500k_2m',
      days_remaining: body.days_remaining || 90,
      urgency: body.urgency || 'normal',
      has_vip: body.has_vip || false,
      has_government: body.has_government || false,
      has_international_speakers: body.has_international_speakers || false,
      has_custom_builds: body.has_custom_builds || false,
      notes: body.notes || '',
    }

    if (!formData.project_name || !formData.client_name || !formData.event_date) {
      return NextResponse.json({ error: 'Missing required fields: project_name, client_name, event_date' }, { status: 400 })
    }

    // 1. Execute rules
    const execution = await executeRules(formData)

    // 2. Generate plan
    const plan = await generatePlan(formData, execution)

    // 3. Save to DB
    const [savedPlan] = await db
      .insert(generated_plans)
      .values({
        name: formData.project_name,
        client_name: formData.client_name,
        event_id: formData.event_id || null,
        form_data: JSON.stringify(formData),
        template_used: execution.templateName,
        complexity_score: plan.complexity_score,
        plan_data: JSON.stringify({
          phases: plan.phases,
          total_duration_days: plan.total_duration_days,
          earliest_start: plan.earliest_start,
          event_date: plan.event_date,
        }),
        risks: JSON.stringify(plan.risks),
        recommendations: JSON.stringify(plan.recommendations),
        version: 1,
        status: 'generated',
        created_by: session.id,
      })
      .returning({ id: generated_plans.id })

    // 4. Save tasks
    if (plan.tasks.length > 0) {
      await db.insert(generated_plan_tasks).values(
        plan.tasks.map((t) => ({
          plan_id: savedPlan.id,
          phase_name: t.phase_name,
          phase_color: t.phase_color,
          phase_order: t.phase_order,
          task_name: t.task_name,
          description: t.description || null,
          duration_days: t.duration_days,
          start_date: t.start_date ? new Date(t.start_date) : null,
          end_date: t.end_date ? new Date(t.end_date) : null,
          role: t.role || null,
          status: 'pending',
          dependencies: t.dependencies.length > 0 ? JSON.stringify(t.dependencies) : null,
          is_critical_path: t.is_critical_path,
          is_optional: t.is_optional,
          sort_order: t.sort_order,
          source: t.source,
        }))
      )
    }

    return NextResponse.json({ id: savedPlan.id }, { status: 201 })
  } catch (err) {
    console.error('Plan generation error:', err)
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}
