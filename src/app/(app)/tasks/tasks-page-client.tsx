'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { TASK_STATUSES, PRIORITIES } from '@/lib/constants'
import { formatDate, getInitials } from '@/lib/utils'
import { Plus, List, Columns3, CheckSquare, Clock, GripVertical } from 'lucide-react'

type Task = {
  id: number
  event_id: number
  title: string
  description: string | null
  status: string | null
  priority: string | null
  assigned_to: number | null
  due_date: Date | null
  sort_order: number | null
  created_at: Date | null
  assignee_first_name: string | null
  assignee_last_name: string | null
  event_title: string | null
}

type Props = {
  tasks: Task[]
  events: { id: number; title: string }[]
  users: { id: number; first_name: string; last_name: string }[]
  canCreate: boolean
  canEdit: boolean
  filters: { event_id?: string; my_tasks?: boolean }
  currentUserId: number
}

const KANBAN_COLUMNS = TASK_STATUSES.filter(s => s.value !== 'cancelled')

export function TasksPageClient({ tasks, events, users, canCreate, canEdit, filters, currentUserId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', event_id: filters.event_id || '', priority: 'medium', assigned_to: '', due_date: '',
  })
  const [loading, setLoading] = useState(false)

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams()
    const merged = { ...filters, [key]: value }
    if (merged.event_id) params.set('event_id', merged.event_id)
    if (merged.my_tasks) params.set('my_tasks', 'true')
    router.push(`/tasks?${params.toString()}`)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.event_id) {
      toast({ type: 'error', message: 'Title and event are required' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          event_id: parseInt(form.event_id),
          assigned_to: form.assigned_to ? parseInt(form.assigned_to) : null,
          due_date: form.due_date || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to create')
      toast({ type: 'success', message: 'Task created' })
      setShowCreate(false)
      setForm({ title: '', description: '', event_id: filters.event_id || '', priority: 'medium', assigned_to: '', due_date: '' })
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to create task' })
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(taskId: number, status: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed')
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to update task' })
    }
  }

  return (
    <>
      <PageHeader
        title="Tasks"
        description={`${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setView('kanban')}
                className={`p-2 cursor-pointer ${view === 'kanban' ? 'bg-primary-50 text-primary-600' : 'text-text-tertiary hover:text-text-primary'}`}
              >
                <Columns3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 cursor-pointer ${view === 'list' ? 'bg-primary-50 text-primary-600' : 'text-text-tertiary hover:text-text-primary'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            {canCreate && (
              <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New Task</Button>
            )}
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select
          options={events.map(e => ({ value: String(e.id), label: e.title }))}
          placeholder="All events"
          value={filters.event_id || ''}
          onChange={(e) => updateFilter('event_id', e.target.value)}
          className="w-48"
        />
        <Button
          variant={filters.my_tasks ? 'primary' : 'outline'}
          size="sm"
          onClick={() => updateFilter('my_tasks', filters.my_tasks ? '' : 'true')}
        >
          My Tasks
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={filters.event_id || filters.my_tasks ? 'Try adjusting your filters' : 'Create your first task to get started'}
          action={canCreate ? { label: 'New Task', onClick: () => setShowCreate(true) } : undefined}
        />
      ) : view === 'kanban' ? (
        <KanbanBoard tasks={tasks} canEdit={canEdit} onStatusChange={handleStatusChange} />
      ) : (
        <TaskList tasks={tasks} canEdit={canEdit} onStatusChange={handleStatusChange} />
      )}

      {/* Create Task Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Task" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Event"
              options={events.map(e => ({ value: String(e.id), label: e.title }))}
              placeholder="Select event..."
              value={form.event_id}
              onChange={e => setForm(f => ({ ...f, event_id: e.target.value }))}
            />
            <Select
              label="Priority"
              options={PRIORITIES.map(p => ({ value: p.value, label: p.label }))}
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Assign to"
              options={users.map(u => ({ value: String(u.id), label: `${u.first_name} ${u.last_name}` }))}
              placeholder="Unassigned"
              value={form.assigned_to}
              onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
            />
            <Input
              label="Due Date"
              type="date"
              value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Create Task</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function KanbanBoard({ tasks, canEdit, onStatusChange }: { tasks: Task[]; canEdit: boolean; onStatusChange: (id: number, status: string) => void }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
      {KANBAN_COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.value)
        return (
          <div key={col.value} className="flex-shrink-0 w-72">
            <div className="flex items-center gap-2 mb-3 px-1">
              <StatusBadge type="task" value={col.value} />
              <span className="text-xs text-text-tertiary">{colTasks.length}</span>
            </div>
            <div
              className="space-y-2 min-h-[200px] bg-gray-50 rounded-lg p-2"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-primary-50') }}
              onDragLeave={(e) => e.currentTarget.classList.remove('bg-primary-50')}
              onDrop={(e) => {
                e.currentTarget.classList.remove('bg-primary-50')
                const taskId = parseInt(e.dataTransfer.getData('taskId'))
                if (taskId && canEdit) onStatusChange(taskId, col.value)
              }}
            >
              {colTasks.map(task => (
                <div
                  key={task.id}
                  draggable={canEdit}
                  onDragStart={(e) => e.dataTransfer.setData('taskId', String(task.id))}
                  className="bg-surface rounded-lg border border-border p-3 cursor-grab active:cursor-grabbing hover:border-primary-200 transition-colors"
                >
                  <p className="text-sm font-medium text-text-primary mb-1">{task.title}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {task.priority && task.priority !== 'medium' && (
                        <StatusBadge type="priority" value={task.priority} />
                      )}
                      {task.due_date && (
                        <span className="text-xs text-text-tertiary flex items-center gap-0.5">
                          <Clock className="h-3 w-3" /> {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                    {task.assignee_first_name && (
                      <div
                        className="h-6 w-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-medium"
                        title={`${task.assignee_first_name} ${task.assignee_last_name}`}
                      >
                        {getInitials(task.assignee_first_name, task.assignee_last_name || '')}
                      </div>
                    )}
                  </div>
                  {task.event_title && (
                    <p className="text-[11px] text-text-tertiary mt-1.5 truncate">{task.event_title}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TaskList({ tasks, canEdit, onStatusChange }: { tasks: Task[]; canEdit: boolean; onStatusChange: (id: number, status: string) => void }) {
  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-gray-50">
            <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Task</th>
            <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Event</th>
            <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Status</th>
            <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Priority</th>
            <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Assignee</th>
            <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Due Date</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task.id} className="border-b border-border last:border-0 hover:bg-gray-50">
              <td className="px-4 py-3">
                <p className="font-medium text-text-primary">{task.title}</p>
              </td>
              <td className="px-4 py-3 text-text-secondary">{task.event_title || '—'}</td>
              <td className="px-4 py-3">
                {canEdit ? (
                  <select
                    value={task.status || 'todo'}
                    onChange={(e) => onStatusChange(task.id, e.target.value)}
                    className="text-xs rounded border border-border bg-surface px-2 py-1 cursor-pointer"
                  >
                    {TASK_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                ) : (
                  <StatusBadge type="task" value={task.status || 'todo'} />
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge type="priority" value={task.priority || 'medium'} />
              </td>
              <td className="px-4 py-3">
                {task.assignee_first_name ? (
                  <span className="text-text-secondary">{task.assignee_first_name} {task.assignee_last_name}</span>
                ) : (
                  <span className="text-text-tertiary">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-text-secondary">{formatDate(task.due_date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
