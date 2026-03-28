import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { plan_templates, plan_template_phases, plan_template_tasks } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { TemplatesClient } from './templates-client'

export default async function PlanTemplatesPage() {
  const session = await getSession()
  if (!session) return null

  const templates = await db.select().from(plan_templates).where(eq(plan_templates.is_active, true)).orderBy(desc(plan_templates.created_at))

  const data = []
  for (const t of templates) {
    const phases = await db.select().from(plan_template_phases).where(eq(plan_template_phases.template_id, t.id))
    let taskCount = 0
    for (const p of phases) {
      const tasks = await db.select().from(plan_template_tasks).where(eq(plan_template_tasks.phase_id, p.id))
      taskCount += tasks.length
    }
    data.push({ ...t, phase_count: phases.length, task_count: taskCount })
  }

  return <TemplatesClient templates={data} />
}
