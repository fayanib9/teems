'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { ArrowLeft, Plus, ChevronDown, ChevronRight, Trash2, Save } from 'lucide-react'

type Task = {
  id: number
  phase_id: number
  name: string
  duration_days: number
  role: string | null
  is_optional: boolean | null
  sort_order: number
  description: string | null
}

type Phase = {
  id: number
  template_id: number
  name: string
  sort_order: number
  color: string | null
  icon: string | null
  tasks: Task[]
}

type Template = {
  id: number
  name: string
  description: string | null
  event_type: string | null
  min_attendees: number | null
  max_attendees: number | null
  is_default: boolean | null
}

type Role = { id: number; name: string; color: string | null }

export function TemplateEditorClient({ template, phases, roles }: { template: Template; phases: Phase[]; roles: Role[] }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<Set<number>>(new Set(phases.map(p => p.id)))
  const [addingPhase, setAddingPhase] = useState(false)
  const [newPhaseName, setNewPhaseName] = useState('')
  const [addingTask, setAddingTask] = useState<number | null>(null)
  const [newTask, setNewTask] = useState({ name: '', duration_days: 5, role: '' })

  function togglePhase(id: number) {
    setExpanded(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  async function addPhase() {
    if (!newPhaseName.trim()) return
    await fetch(`/api/tools/plan-templates/${template.id}/phases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPhaseName, sort_order: phases.length + 1 }),
    })
    setNewPhaseName('')
    setAddingPhase(false)
    router.refresh()
  }

  async function addTask(phaseId: number) {
    if (!newTask.name.trim()) return
    const phase = phases.find(p => p.id === phaseId)
    await fetch(`/api/tools/plan-templates/${template.id}/phases/${phaseId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newTask, sort_order: (phase?.tasks.length || 0) + 1 }),
    })
    setNewTask({ name: '', duration_days: 5, role: '' })
    setAddingTask(null)
    router.refresh()
  }

  async function deletePhase(phaseId: number) {
    await fetch(`/api/tools/plan-templates/${template.id}/phases/${phaseId}`, { method: 'DELETE' })
    router.refresh()
  }

  const inputCls = 'px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500'

  return (
    <>
      <PageHeader
        title={template.name}
        description={`${template.event_type || 'General'} template • ${phases.length} phases`}
        actions={
          <Link href="/admin/plan-templates" className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" />Back
          </Link>
        }
      />

      {/* Template info */}
      <div className="bg-surface rounded-xl border border-border p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-text-tertiary">Event Type:</span> <span className="text-text-primary font-medium capitalize">{template.event_type || '—'}</span></div>
          <div><span className="text-text-tertiary">Min Attendees:</span> <span className="text-text-primary font-medium">{template.min_attendees?.toLocaleString() || '—'}</span></div>
          <div><span className="text-text-tertiary">Max Attendees:</span> <span className="text-text-primary font-medium">{template.max_attendees?.toLocaleString() || '—'}</span></div>
          <div><span className="text-text-tertiary">Default:</span> <span className="text-text-primary font-medium">{template.is_default ? 'Yes' : 'No'}</span></div>
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-3 mb-4">
        {phases.map(phase => (
          <div key={phase.id} className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-surface-secondary" onClick={() => togglePhase(phase.id)}>
              {expanded.has(phase.id) ? <ChevronDown className="h-4 w-4 text-text-tertiary" /> : <ChevronRight className="h-4 w-4 text-text-tertiary" />}
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: phase.color || '#6B7280' }} />
              <span className="text-sm font-semibold text-text-primary flex-1">{phase.name}</span>
              <span className="text-xs text-text-tertiary mr-2">{phase.tasks.length} tasks</span>
              <button onClick={e => { e.stopPropagation(); deletePhase(phase.id) }} className="text-text-tertiary hover:text-red-500 p-1">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {expanded.has(phase.id) && (
              <div className="border-t border-border">
                {phase.tasks.length > 0 && (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-secondary text-xs text-text-tertiary">
                        <th className="text-left px-5 py-1.5 font-medium">#</th>
                        <th className="text-left px-3 py-1.5 font-medium">Task</th>
                        <th className="text-left px-3 py-1.5 font-medium">Duration</th>
                        <th className="text-left px-3 py-1.5 font-medium">Role</th>
                        <th className="text-left px-3 py-1.5 font-medium">Optional</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {phase.tasks.map((task, i) => (
                        <tr key={task.id} className="hover:bg-surface-secondary">
                          <td className="px-5 py-2 text-xs text-text-tertiary">{i + 1}</td>
                          <td className="px-3 py-2 text-sm text-text-primary">{task.name}</td>
                          <td className="px-3 py-2 text-xs text-text-secondary">{task.duration_days}d</td>
                          <td className="px-3 py-2 text-xs text-text-secondary">{task.role || '—'}</td>
                          <td className="px-3 py-2 text-xs text-text-secondary">{task.is_optional ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Add task */}
                {addingTask === phase.id ? (
                  <div className="px-5 py-3 bg-surface-secondary flex items-center gap-2">
                    <input type="text" className={`${inputCls} flex-1`} placeholder="Task name" value={newTask.name} onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))} />
                    <input type="number" className={`${inputCls} w-20`} placeholder="Days" value={newTask.duration_days} onChange={e => setNewTask(p => ({ ...p, duration_days: parseInt(e.target.value) || 5 }))} />
                    <select className={inputCls} value={newTask.role} onChange={e => setNewTask(p => ({ ...p, role: e.target.value }))}>
                      <option value="">Role...</option>
                      {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                    <button onClick={() => addTask(phase.id)} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium">Add</button>
                    <button onClick={() => setAddingTask(null)} className="text-text-tertiary hover:text-text-primary text-xs">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setAddingTask(phase.id)} className="w-full px-5 py-2.5 text-xs text-primary-600 hover:bg-primary-50 flex items-center gap-1">
                    <Plus className="h-3 w-3" />Add Task
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add phase */}
      {addingPhase ? (
        <div className="flex items-center gap-2">
          <input type="text" className={`${inputCls} flex-1`} placeholder="Phase name" value={newPhaseName} onChange={e => setNewPhaseName(e.target.value)} autoFocus />
          <button onClick={addPhase} className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium">Add Phase</button>
          <button onClick={() => setAddingPhase(false)} className="text-sm text-text-tertiary hover:text-text-primary">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setAddingPhase(true)} className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
          <Plus className="h-4 w-4" />Add Phase
        </button>
      )}
    </>
  )
}
