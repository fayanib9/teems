import { db } from '@/db'
import { plan_rules, plan_templates, plan_template_phases, plan_template_tasks } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { evaluateCondition } from './evaluator'
import { calculateComplexity } from './complexity'
import type { PlanFormData, ExecutionResult, PlanAction, GeneratedPlan, GeneratedTask, ConditionNode } from './types'

/**
 * Execute all active plan rules against form data.
 */
export async function executeRules(formData: PlanFormData): Promise<ExecutionResult> {
  const rules = await db
    .select()
    .from(plan_rules)
    .where(eq(plan_rules.is_active, true))
    .orderBy(asc(plan_rules.priority))

  const result: ExecutionResult = {
    templateName: null,
    injectedTasks: [],
    durationMultipliers: [],
    risks: [],
    recommendations: [],
    complexityWeights: [],
    flags: [],
  }

  for (const rule of rules) {
    let condition: ConditionNode
    let actions: PlanAction[]
    try {
      condition = JSON.parse(rule.condition) as ConditionNode
      actions = JSON.parse(rule.actions) as PlanAction[]
    } catch (err) {
      console.warn(`Skipping plan rule ${rule.id} (${rule.name}): invalid JSON`, err)
      continue
    }

    if (evaluateCondition(condition, formData as unknown as Record<string, unknown>)) {
      for (const action of actions) {
        switch (action.type) {
          case 'select_template':
            if (!result.templateName) result.templateName = action.template_name
            break
          case 'add_task':
            result.injectedTasks.push({ phase: action.phase, task: action.task })
            break
          case 'modify_duration':
            result.durationMultipliers.push({ target: action.target, multiplier: action.multiplier })
            break
          case 'add_risk':
            result.risks.push({ severity: action.severity, title: action.title, description: action.description })
            break
          case 'add_recommendation':
            result.recommendations.push({ title: action.title, description: action.description })
            break
          case 'set_complexity_weight':
            result.complexityWeights.push({ factor: action.factor, weight: action.weight, value: action.value })
            break
        }
      }
    }
  }

  return result
}

/**
 * Generate a full project plan from form data and rule execution results.
 */
export async function generatePlan(formData: PlanFormData, execution: ExecutionResult): Promise<GeneratedPlan> {
  // 1. Load template
  let templatePhases: { name: string; color: string | null; icon: string | null; sort_order: number; tasks: { name: string; duration_days: number; role: string | null; is_optional: boolean | null; dependencies: string | null; sort_order: number; description: string | null }[] }[] = []

  if (execution.templateName) {
    const [template] = await db
      .select()
      .from(plan_templates)
      .where(eq(plan_templates.name, execution.templateName))
      .limit(1)

    if (template) {
      const phases = await db
        .select()
        .from(plan_template_phases)
        .where(eq(plan_template_phases.template_id, template.id))
        .orderBy(asc(plan_template_phases.sort_order))

      for (const phase of phases) {
        const tasks = await db
          .select()
          .from(plan_template_tasks)
          .where(eq(plan_template_tasks.phase_id, phase.id))
          .orderBy(asc(plan_template_tasks.sort_order))

        templatePhases.push({
          name: phase.name,
          color: phase.color,
          icon: phase.icon,
          sort_order: phase.sort_order,
          tasks: tasks.map(t => ({
            name: t.name,
            duration_days: t.duration_days,
            role: t.role,
            is_optional: t.is_optional,
            dependencies: t.dependencies,
            sort_order: t.sort_order,
            description: t.description,
          })),
        })
      }
    }
  }

  // 2. Build all tasks list (template + injected)
  const allTasks: GeneratedTask[] = []
  let globalOrder = 0

  for (const phase of templatePhases) {
    for (const task of phase.tasks) {
      globalOrder++
      allTasks.push({
        phase_name: phase.name,
        phase_color: phase.color || '#6B7280',
        phase_order: phase.sort_order,
        task_name: task.name,
        description: task.description || '',
        duration_days: task.duration_days,
        start_date: '',
        end_date: '',
        role: task.role || '',
        dependencies: task.dependencies ? (() => { try { return JSON.parse(task.dependencies!) } catch { return [] } })() : [],
        is_critical_path: false,
        is_optional: task.is_optional || false,
        sort_order: globalOrder,
        source: 'template',
      })
    }
  }

  // Add injected tasks from rules
  for (const injected of execution.injectedTasks) {
    globalOrder++
    const phaseInfo = templatePhases.find(p => p.name === injected.phase)
    allTasks.push({
      phase_name: injected.phase,
      phase_color: phaseInfo?.color || '#6B7280',
      phase_order: phaseInfo?.sort_order || 99,
      task_name: injected.task.name,
      description: injected.task.description || '',
      duration_days: injected.task.duration_days,
      start_date: '',
      end_date: '',
      role: injected.task.role || '',
      dependencies: [],
      is_critical_path: false,
      is_optional: false,
      sort_order: globalOrder,
      source: 'rule_injection',
    })
  }

  // 3. Apply duration multipliers
  for (const mod of execution.durationMultipliers) {
    for (const task of allTasks) {
      if (mod.target === '*' || mod.target === task.phase_name) {
        task.duration_days = Math.max(1, Math.ceil(task.duration_days * mod.multiplier))
      }
    }
  }

  // 4. Backward schedule from event date
  const eventDate = new Date(formData.event_date)

  // Group tasks by phase
  const phaseNames = [...new Set(allTasks.map(t => t.phase_name))]
  // Sort phases by their order
  phaseNames.sort((a, b) => {
    const orderA = allTasks.find(t => t.phase_name === a)?.phase_order || 0
    const orderB = allTasks.find(t => t.phase_name === b)?.phase_order || 0
    return orderA - orderB
  })

  // Schedule backward: last phase ends at event date, each prior phase ends where next begins
  let phaseEndDate = new Date(eventDate)

  for (let i = phaseNames.length - 1; i >= 0; i--) {
    const phaseName = phaseNames[i]
    const phaseTasks = allTasks.filter(t => t.phase_name === phaseName)

    // Sort tasks within phase by sort_order descending (schedule backward)
    phaseTasks.sort((a, b) => b.sort_order - a.sort_order)

    let taskEndDate = new Date(phaseEndDate)

    for (const task of phaseTasks) {
      const endDate = new Date(taskEndDate)
      const startDate = subtractBusinessDays(endDate, task.duration_days)

      task.end_date = endDate.toISOString().split('T')[0]
      task.start_date = startDate.toISOString().split('T')[0]

      // Next task in this phase ends where this one starts
      taskEndDate = new Date(startDate)
    }

    // Phase buffer: previous phase ends 1 business day before this phase starts
    const earliestInPhase = phaseTasks.reduce((earliest, t) => {
      const d = new Date(t.start_date)
      return d < earliest ? d : earliest
    }, new Date(phaseEndDate))

    phaseEndDate = subtractBusinessDays(earliestInPhase, 1)
  }

  // 5. Calculate complexity
  const complexityScore = calculateComplexity(execution.complexityWeights)

  // 6. Detect critical path using forward/backward pass
  computeCriticalPath(allTasks)

  // 7. Add timeline risk if plan starts in the past
  const allStartDates = allTasks.map(t => new Date(t.start_date)).filter(d => !isNaN(d.getTime()))
  const earliestStart = allStartDates.length > 0 ? allStartDates.reduce((min, d) => d < min ? d : min) : new Date()

  if (earliestStart < new Date()) {
    execution.risks.push({
      severity: 'critical',
      title: 'Timeline Impossible',
      description: `The plan requires starting on ${earliestStart.toISOString().split('T')[0]}, which is in the past. Consider extending the event date or reducing scope.`,
    })
  }

  // 8. Build phase summary
  const phases = phaseNames.map((name, i) => {
    const phaseTasks = allTasks.filter(t => t.phase_name === name)
    return {
      name,
      color: phaseTasks[0]?.phase_color || '#6B7280',
      icon: templatePhases.find(p => p.name === name)?.icon || 'Circle',
      order: i + 1,
      task_count: phaseTasks.length,
      total_duration: phaseTasks.reduce((sum, t) => sum + t.duration_days, 0),
    }
  })

  // Total duration: actual calendar span from earliest start to event date in business days
  const totalDuration = countBusinessDays(earliestStart, eventDate)

  return {
    phases,
    tasks: allTasks.sort((a, b) => a.phase_order - b.phase_order || a.sort_order - b.sort_order),
    risks: execution.risks,
    recommendations: execution.recommendations,
    complexity_score: complexityScore,
    total_duration_days: totalDuration,
    earliest_start: earliestStart.toISOString().split('T')[0],
    event_date: formData.event_date,
  }
}

/**
 * Known Saudi public holidays (fixed-date ones).
 * Ramadan and Eid dates change yearly based on the Hijri calendar
 * and need manual updates each year.
 */
const SAUDI_HOLIDAYS: Array<{ month: number; day: number }> = [
  { month: 2, day: 22 },  // Founding Day (Feb 22)
  { month: 9, day: 23 },  // National Day (Sep 23)
]

function isSaudiHoliday(date: Date): boolean {
  const m = date.getMonth() + 1
  const d = date.getDate()
  return SAUDI_HOLIDAYS.some(h => h.month === m && h.day === d)
}

function isNonWorkingDay(date: Date): boolean {
  const day = date.getDay()
  // Saudi weekends: Friday (5) and Saturday (6)
  if (day === 5 || day === 6) return true
  if (isSaudiHoliday(date)) return true
  return false
}

/**
 * Subtract business days from a date (Saudi weekends: Friday=5, Saturday=6)
 * Skips Saudi public holidays.
 */
function subtractBusinessDays(date: Date, days: number): Date {
  // Edge case: zero or negative duration returns the same date
  if (days <= 0) return new Date(date)

  const result = new Date(date)
  let remaining = days
  let iterations = 0
  const MAX_ITERATIONS = 1000

  while (remaining > 0 && iterations < MAX_ITERATIONS) {
    iterations++
    result.setDate(result.getDate() - 1)
    if (!isNonWorkingDay(result)) {
      remaining--
    }
  }

  if (iterations >= MAX_ITERATIONS) {
    console.warn(`subtractBusinessDays hit max iterations (${MAX_ITERATIONS}) for ${days} business days`)
  }

  return result
}

/**
 * Count business days between two dates (exclusive of end date).
 */
function countBusinessDays(start: Date, end: Date): number {
  if (start >= end) return 0
  const cursor = new Date(start)
  let count = 0
  let iterations = 0
  const MAX_ITERATIONS = 5000

  while (cursor < end && iterations < MAX_ITERATIONS) {
    iterations++
    if (!isNonWorkingDay(cursor)) {
      count++
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return count
}

/**
 * Compute critical path using forward/backward pass.
 * Tasks with zero float (ES === LS) are on the critical path.
 * Falls back to marking the longest chain per phase if no dependencies exist.
 */
function computeCriticalPath(allTasks: GeneratedTask[]): void {
  // Build a dependency graph by task_name
  const taskMap = new Map<string, GeneratedTask>()
  for (const t of allTasks) taskMap.set(t.task_name, t)

  const hasDependencies = allTasks.some(t => t.dependencies.length > 0)

  if (!hasDependencies) {
    // Fallback: mark the longest non-optional task chain per phase
    const phaseNames = [...new Set(allTasks.map(t => t.phase_name))]
    for (const phaseName of phaseNames) {
      const phaseTasks = allTasks.filter(t => t.phase_name === phaseName && !t.is_optional)
      if (phaseTasks.length > 0) {
        const longestTask = phaseTasks.reduce((max, t) => t.duration_days > max.duration_days ? t : max, phaseTasks[0])
        longestTask.is_critical_path = true
      }
    }
    return
  }

  // Forward pass: calculate earliest start (ES) and earliest finish (EF)
  const es = new Map<string, number>()
  const ef = new Map<string, number>()

  // Topological order via Kahn's algorithm
  const inDegree = new Map<string, number>()
  const successors = new Map<string, string[]>()

  for (const t of allTasks) {
    inDegree.set(t.task_name, 0)
    successors.set(t.task_name, [])
  }

  for (const t of allTasks) {
    let depCount = 0
    for (const depName of t.dependencies) {
      if (taskMap.has(depName)) {
        successors.get(depName)!.push(t.task_name)
        depCount++
      }
    }
    inDegree.set(t.task_name, depCount)
  }

  const queue: string[] = []
  for (const [name, deg] of inDegree) {
    if (deg === 0) {
      es.set(name, 0)
      ef.set(name, taskMap.get(name)!.duration_days)
      queue.push(name)
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!
    const currentEF = ef.get(current)!
    for (const succ of successors.get(current)!) {
      const prevES = es.get(succ)
      if (prevES === undefined || currentEF > prevES) {
        es.set(succ, currentEF)
        ef.set(succ, currentEF + taskMap.get(succ)!.duration_days)
      }
      inDegree.set(succ, inDegree.get(succ)! - 1)
      if (inDegree.get(succ) === 0) {
        queue.push(succ)
      }
    }
  }

  // Project duration
  const projectDuration = Math.max(...[...ef.values()])

  // Backward pass: calculate latest start (LS) and latest finish (LF)
  const ls = new Map<string, number>()
  const lf = new Map<string, number>()

  for (const t of allTasks) {
    lf.set(t.task_name, projectDuration)
    ls.set(t.task_name, projectDuration - t.duration_days)
  }

  // Process in reverse topological order
  const reverseOrder = [...allTasks].sort((a, b) => (ef.get(b.task_name) || 0) - (ef.get(a.task_name) || 0))

  for (const t of reverseOrder) {
    for (const depName of t.dependencies) {
      if (taskMap.has(depName)) {
        const currentLS = ls.get(t.task_name)!
        const depLF = lf.get(depName)
        if (depLF === undefined || currentLS < depLF) {
          lf.set(depName, currentLS)
          ls.set(depName, currentLS - taskMap.get(depName)!.duration_days)
        }
      }
    }
  }

  // Mark tasks with zero float as critical path
  for (const t of allTasks) {
    const taskES = es.get(t.task_name)
    const taskLS = ls.get(t.task_name)
    if (taskES !== undefined && taskLS !== undefined && Math.abs(taskES - taskLS) < 0.001) {
      t.is_critical_path = true
    }
  }
}
