'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import {
  ArrowLeft, BarChart3, Calendar, Clock, AlertTriangle,
  Lightbulb, CheckCircle, Target, ClipboardList, ShoppingCart,
  Rocket, Circle, ChevronDown, ChevronRight, Zap, PlayCircle,
} from 'lucide-react'

type Task = {
  id: number
  plan_id: number
  phase_name: string
  phase_color: string | null
  phase_order: number | null
  task_name: string
  description: string | null
  duration_days: number
  start_date: Date | null
  end_date: Date | null
  role: string | null
  status: string | null
  dependencies: string | null
  is_critical_path: boolean | null
  is_optional: boolean | null
  sort_order: number
  source: string | null
}

type Plan = {
  id: number
  name: string
  client_name: string
  event_id: number | null
  form_data: Record<string, unknown>
  plan_data: { phases: { name: string; color: string; icon: string; order: number; task_count: number; total_duration: number }[]; total_duration_days: number; earliest_start: string; event_date: string } | null
  template_used: string | null
  complexity_score: number | null
  risks: { severity: string; title: string; description: string }[]
  recommendations: { title: string; description: string }[]
  version: number
  status: string | null
  created_at: Date | null
}

const TABS = ['Overview', 'Tasks', 'Timeline', 'Risks'] as const

const PHASE_ICONS: Record<string, React.ElementType> = {
  Target, ClipboardList, ShoppingCart, Rocket, CheckCircle, Circle,
}

function getPhaseIcon(name: string): React.ElementType {
  if (name.includes('Strategy') || name.includes('Concept')) return Target
  if (name.includes('Planning') || name.includes('Design')) return ClipboardList
  if (name.includes('Procurement') || name.includes('Contract')) return ShoppingCart
  if (name.includes('Execution') || name.includes('Build') || name.includes('Production')) return Rocket
  if (name.includes('Closure') || name.includes('Post')) return CheckCircle
  return Circle
}

function formatDate(d: Date | string | null) {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getComplexityLabel(score: number | null) {
  if (!score) return { label: 'Unknown', color: 'text-gray-500' }
  if (score < 30) return { label: 'Low', color: 'text-green-600' }
  if (score < 60) return { label: 'Medium', color: 'text-amber-600' }
  if (score < 80) return { label: 'High', color: 'text-orange-600' }
  return { label: 'Very High', color: 'text-red-600' }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'low': return 'bg-green-100 text-green-700'
    case 'medium': return 'bg-amber-100 text-amber-700'
    case 'high': return 'bg-orange-100 text-orange-700'
    case 'critical': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export function PlanDetailClient({ plan, tasks }: { plan: Plan; tasks: Task[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [tab, setTab] = useState<typeof TABS[number]>('Overview')
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(plan.plan_data?.phases.map(p => p.name) || []))
  const [applying, setApplying] = useState(false)
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [applyEventId, setApplyEventId] = useState(plan.event_id?.toString() || '')

  const complexity = getComplexityLabel(plan.complexity_score)

  function togglePhase(name: string) {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  async function handleApplyPlan() {
    if (!applyEventId) {
      toast({ type: 'error', message: 'Please enter an event ID' })
      return
    }
    setApplying(true)
    try {
      const res = await fetch(`/api/tools/plans/${plan.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: Number(applyEventId) }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to apply plan')
      }
      const { tasks_created } = await res.json()
      toast({ type: 'success', message: `Plan applied: ${tasks_created} tasks created` })
      setShowApplyDialog(false)
      router.refresh()
    } catch (err: unknown) {
      toast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to apply plan' })
    } finally {
      setApplying(false)
    }
  }

  // Group tasks by phase
  const phases = plan.plan_data?.phases || []
  const tasksByPhase: Record<string, Task[]> = {}
  for (const task of tasks) {
    if (!tasksByPhase[task.phase_name]) tasksByPhase[task.phase_name] = []
    tasksByPhase[task.phase_name].push(task)
  }

  // Calculate Gantt date range
  const allDates = tasks.flatMap(t => [t.start_date, t.end_date]).filter(Boolean) as Date[]
  const ganttStart = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => new Date(d).getTime()))) : new Date()
  const ganttEnd = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => new Date(d).getTime()))) : new Date()
  const ganttDays = Math.max(1, Math.ceil((ganttEnd.getTime() - ganttStart.getTime()) / (1000 * 60 * 60 * 24)))

  return (
    <>
      <PageHeader
        title={plan.name}
        description={`${plan.client_name} • ${plan.template_used || 'Custom'} Template • v${plan.version}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => setShowApplyDialog(true)}>
              <PlayCircle className="h-3.5 w-3.5" /> Apply to Event
            </Button>
            <Link
              href="/tools/planner"
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Plans
            </Link>
          </div>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-tertiary mb-1">Complexity</p>
          <p className={`text-xl font-bold ${complexity.color}`}>{plan.complexity_score ?? 0}<span className="text-sm font-normal text-text-tertiary">/100</span></p>
          <p className={`text-xs font-medium ${complexity.color}`}>{complexity.label}</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-tertiary mb-1">Total Tasks</p>
          <p className="text-xl font-bold text-text-primary">{tasks.length}</p>
          <p className="text-xs text-text-tertiary">{tasks.filter(t => t.is_critical_path).length} critical path</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-tertiary mb-1">Duration</p>
          <p className="text-xl font-bold text-text-primary">{plan.plan_data?.total_duration_days ?? 0}<span className="text-sm font-normal text-text-tertiary"> days</span></p>
          <p className="text-xs text-text-tertiary">{phases.length} phases</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-xs text-text-tertiary mb-1">Risks</p>
          <p className="text-xl font-bold text-text-primary">{plan.risks.length}</p>
          <p className="text-xs text-text-tertiary">{plan.risks.filter(r => r.severity === 'critical' || r.severity === 'high').length} high/critical</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'Overview' && (
        <div className="space-y-6">
          {/* Phase Summary */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Phase Breakdown</h3>
            <div className="space-y-3">
              {phases.map((phase) => {
                const Icon = getPhaseIcon(phase.name)
                const phaseTasks = tasksByPhase[phase.name] || []
                const completedCount = phaseTasks.filter(t => t.status === 'completed').length
                return (
                  <div key={phase.name} className="flex items-center gap-3">
                    <div className="rounded-lg p-1.5" style={{ backgroundColor: `${phase.color}15` }}>
                      <Icon className="h-4 w-4" style={{ color: phase.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-text-primary">{phase.name}</span>
                        <span className="text-xs text-text-tertiary">{phase.task_count} tasks &middot; {phase.total_duration} days</span>
                      </div>
                      <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ backgroundColor: phase.color, width: `${phase.task_count > 0 ? (completedCount / phase.task_count) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recommendations */}
          {plan.recommendations.length > 0 && (
            <div className="bg-surface rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Recommendations
              </h3>
              <div className="space-y-2">
                {plan.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">{rec.title}</p>
                      <p className="text-xs text-amber-700 mt-0.5">{rec.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {tab === 'Tasks' && (
        <div className="space-y-4">
          {phases.map((phase) => {
            const Icon = getPhaseIcon(phase.name)
            const phaseTasks = tasksByPhase[phase.name] || []
            const expanded = expandedPhases.has(phase.name)

            return (
              <div key={phase.name} className="bg-surface rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => togglePhase(phase.name)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-surface-secondary transition-colors"
                >
                  {expanded ? <ChevronDown className="h-4 w-4 text-text-tertiary" /> : <ChevronRight className="h-4 w-4 text-text-tertiary" />}
                  <div className="rounded-lg p-1.5" style={{ backgroundColor: `${phase.color}15` }}>
                    <Icon className="h-4 w-4" style={{ color: phase.color }} />
                  </div>
                  <span className="text-sm font-semibold text-text-primary">{phase.name}</span>
                  <span className="text-xs text-text-tertiary ml-auto">{phaseTasks.length} tasks</span>
                </button>

                {expanded && phaseTasks.length > 0 && (
                  <div className="border-t border-border">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-surface-secondary">
                          <th className="text-left text-xs font-medium text-text-tertiary px-5 py-2">Task</th>
                          <th className="text-left text-xs font-medium text-text-tertiary px-3 py-2">Role</th>
                          <th className="text-left text-xs font-medium text-text-tertiary px-3 py-2">Duration</th>
                          <th className="text-left text-xs font-medium text-text-tertiary px-3 py-2">Start</th>
                          <th className="text-left text-xs font-medium text-text-tertiary px-3 py-2">End</th>
                          <th className="text-left text-xs font-medium text-text-tertiary px-3 py-2">Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {phaseTasks.map((task) => (
                          <tr key={task.id} className="hover:bg-surface-secondary">
                            <td className="px-5 py-2.5">
                              <div className="flex items-center gap-2">
                                {task.is_critical_path && <Zap className="h-3 w-3 text-red-500 shrink-0" />}
                                <span className={`text-sm ${task.is_optional ? 'text-text-tertiary italic' : 'text-text-primary'}`}>
                                  {task.task_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-text-secondary">{task.role || '—'}</td>
                            <td className="px-3 py-2.5 text-xs text-text-secondary">{task.duration_days}d</td>
                            <td className="px-3 py-2.5 text-xs text-text-secondary">{formatDate(task.start_date)}</td>
                            <td className="px-3 py-2.5 text-xs text-text-secondary">{formatDate(task.end_date)}</td>
                            <td className="px-3 py-2.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                task.source === 'rule_injection' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {task.source === 'rule_injection' ? 'Rule' : 'Template'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Timeline Tab (Simple Gantt) */}
      {tab === 'Timeline' && (
        <div className="bg-surface rounded-xl border border-border p-5 overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Project Timeline</h3>
            <div className="flex items-center gap-4 text-xs text-text-tertiary">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(plan.plan_data?.earliest_start || null)}</span>
              <span>→</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(plan.plan_data?.event_date || null)}</span>
            </div>
          </div>

          <div className="min-w-[600px]">
            {phases.map((phase) => {
              const phaseTasks = tasksByPhase[phase.name] || []

              return (
                <div key={phase.name} className="mb-4">
                  <p className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: phase.color }} />
                    {phase.name}
                  </p>
                  <div className="space-y-1">
                    {phaseTasks.slice(0, 8).map((task) => {
                      const taskStart = task.start_date ? new Date(task.start_date).getTime() : ganttStart.getTime()
                      const taskEnd = task.end_date ? new Date(task.end_date).getTime() : ganttStart.getTime()
                      const leftPct = ((taskStart - ganttStart.getTime()) / (ganttEnd.getTime() - ganttStart.getTime())) * 100
                      const widthPct = Math.max(1, ((taskEnd - taskStart) / (ganttEnd.getTime() - ganttStart.getTime())) * 100)

                      return (
                        <div key={task.id} className="flex items-center gap-2 h-6">
                          <span className="text-[10px] text-text-tertiary w-32 truncate shrink-0">{task.task_name}</span>
                          <div className="flex-1 relative bg-surface-tertiary rounded h-4">
                            <div
                              className={`absolute h-full rounded ${task.is_critical_path ? 'bg-red-400' : ''}`}
                              style={{
                                left: `${Math.max(0, leftPct)}%`,
                                width: `${Math.min(widthPct, 100 - leftPct)}%`,
                                backgroundColor: task.is_critical_path ? undefined : phase.color,
                                opacity: task.is_optional ? 0.5 : 0.8,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                    {phaseTasks.length > 8 && (
                      <p className="text-[10px] text-text-tertiary pl-32">+{phaseTasks.length - 8} more tasks</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Risks Tab */}
      {tab === 'Risks' && (
        <div className="space-y-4">
          {plan.risks.length === 0 ? (
            <div className="bg-surface rounded-xl border border-border p-8 text-center">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <h3 className="text-base font-medium text-text-primary">No Risks Identified</h3>
              <p className="text-sm text-text-secondary mt-1">The current plan parameters don&apos;t trigger any risk flags.</p>
            </div>
          ) : (
            <>
              {/* Risk Summary */}
              <div className="grid grid-cols-4 gap-3">
                {(['critical', 'high', 'medium', 'low'] as const).map((level) => {
                  const count = plan.risks.filter(r => r.severity === level).length
                  return (
                    <div key={level} className={`rounded-xl p-3 text-center ${getSeverityColor(level)}`}>
                      <p className="text-xl font-bold">{count}</p>
                      <p className="text-xs font-medium capitalize">{level}</p>
                    </div>
                  )
                })}
              </div>

              {/* Risk List */}
              <div className="space-y-3">
                {plan.risks.map((risk, i) => (
                  <div key={i} className="bg-surface rounded-xl border border-border p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${
                        risk.severity === 'critical' ? 'text-red-500' :
                        risk.severity === 'high' ? 'text-orange-500' :
                        risk.severity === 'medium' ? 'text-amber-500' : 'text-green-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-text-primary">{risk.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSeverityColor(risk.severity)}`}>
                            {risk.severity}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary">{risk.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Apply Plan Dialog */}
      {showApplyDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowApplyDialog(false)}>
          <div className="bg-surface rounded-xl border border-border p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-text-primary mb-2">Apply Plan to Event</h3>
            <p className="text-sm text-text-secondary mb-4">
              This will create {tasks.filter(t => !t.is_optional).length} real tasks in the selected event from this generated plan.
            </p>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Event ID *</label>
            <input
              type="number"
              value={applyEventId}
              onChange={e => setApplyEventId(e.target.value)}
              placeholder="Enter event ID"
              className="w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowApplyDialog(false)}>Cancel</Button>
              <Button size="sm" loading={applying} onClick={handleApplyPlan}>
                <PlayCircle className="h-3.5 w-3.5" /> Apply Plan
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
