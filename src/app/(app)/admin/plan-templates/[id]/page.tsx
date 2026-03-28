import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { plan_templates, plan_template_phases, plan_template_tasks, plan_roles } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { TemplateEditorClient } from './template-editor-client'

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return null

  const { id } = await params
  const templateId = parseInt(id)
  if (isNaN(templateId)) notFound()

  const [template] = await db.select().from(plan_templates).where(eq(plan_templates.id, templateId)).limit(1)
  if (!template) notFound()

  const phases = await db.select().from(plan_template_phases).where(eq(plan_template_phases.template_id, templateId)).orderBy(asc(plan_template_phases.sort_order))

  const phasesWithTasks = []
  for (const phase of phases) {
    const tasks = await db.select().from(plan_template_tasks).where(eq(plan_template_tasks.phase_id, phase.id)).orderBy(asc(plan_template_tasks.sort_order))
    phasesWithTasks.push({ ...phase, tasks })
  }

  const roles = await db.select().from(plan_roles).where(eq(plan_roles.is_active, true))

  return <TemplateEditorClient template={template} phases={phasesWithTasks} roles={roles} />
}
