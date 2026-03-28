'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { getInitials } from '@/lib/utils'
import { ArrowLeft, Grid3X3 } from 'lucide-react'
import Link from 'next/link'

type Task = { id: number; title: string }
type Member = { user_id: number; first_name: string; last_name: string }
type Assignment = { id: number; task_id: number; user_id: number; raci_type: string }

type Props = {
  eventId: number
  eventTitle: string
  tasks: Task[]
  members: Member[]
  assignments: Assignment[]
}

const RACI_OPTIONS = [
  { value: 'none', label: '-', color: '' },
  { value: 'responsible', label: 'R', color: 'bg-blue-100 text-blue-700' },
  { value: 'accountable', label: 'A', color: 'bg-purple-100 text-purple-700' },
  { value: 'consulted', label: 'C', color: 'bg-amber-100 text-amber-700' },
  { value: 'informed', label: 'I', color: 'bg-green-100 text-green-700' },
]

export function RaciClient({ eventId, eventTitle, tasks, members, assignments: initialAssignments }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [assignments, setAssignments] = useState(initialAssignments)

  function getAssignment(taskId: number, userId: number): string {
    const a = assignments.find(a => a.task_id === taskId && a.user_id === userId)
    return a?.raci_type || 'none'
  }

  async function handleChange(taskId: number, userId: number, raciType: string) {
    // Optimistic update
    const prev = assignments
    setAssignments(current => {
      const filtered = current.filter(a => !(a.task_id === taskId && a.user_id === userId))
      if (raciType !== 'none') {
        filtered.push({ id: 0, task_id: taskId, user_id: userId, raci_type: raciType })
      }
      return filtered
    })

    try {
      const res = await fetch(`/api/events/${eventId}/raci`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, user_id: userId, raci_type: raciType }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setAssignments(prev)
      toast({ type: 'error', message: 'Failed to update RACI assignment' })
    }
  }

  function cycleRaci(taskId: number, userId: number) {
    const current = getAssignment(taskId, userId)
    const idx = RACI_OPTIONS.findIndex(o => o.value === current)
    const next = RACI_OPTIONS[(idx + 1) % RACI_OPTIONS.length]
    handleChange(taskId, userId, next.value)
  }

  if (tasks.length === 0 || members.length === 0) {
    return (
      <>
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/events/${eventId}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <p className="text-xs text-text-tertiary">{eventTitle}</p>
            <h1 className="text-xl font-semibold text-text-primary">RACI Matrix</h1>
          </div>
        </div>
        <EmptyState
          icon={Grid3X3}
          title={tasks.length === 0 ? 'No tasks yet' : 'No team members assigned'}
          description={tasks.length === 0
            ? 'Add tasks to the event first to build the RACI matrix.'
            : 'Assign team members to the event first.'}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-1">
        <Link href={`/events/${eventId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <p className="text-xs text-text-tertiary">{eventTitle}</p>
          <h1 className="text-xl font-semibold text-text-primary">RACI Matrix</h1>
        </div>
      </div>
      <p className="text-sm text-text-secondary mb-4 ml-12">
        Click cells to cycle: <span className="font-medium">R</span>esponsible, <span className="font-medium">A</span>ccountable, <span className="font-medium">C</span>onsulted, <span className="font-medium">I</span>nformed
      </p>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left px-4 py-3 font-medium text-text-secondary min-w-[200px] sticky left-0 bg-surface-secondary z-10">
                  Task
                </th>
                {members.map(m => (
                  <th key={m.user_id} className="px-2 py-3 text-center font-medium text-text-secondary min-w-[60px]">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-7 w-7 rounded-full bg-primary-100 text-primary-700 font-medium text-[10px] flex items-center justify-center">
                        {getInitials(m.first_name, m.last_name)}
                      </div>
                      <span className="text-[10px] leading-tight max-w-[60px] truncate">
                        {m.first_name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id} className="border-b border-border-light">
                  <td className="px-4 py-2 text-text-primary sticky left-0 bg-surface z-10 border-r border-border-light">
                    <span className="truncate block max-w-[250px]" title={task.title}>
                      {task.title}
                    </span>
                  </td>
                  {members.map(m => {
                    const value = getAssignment(task.id, m.user_id)
                    const option = RACI_OPTIONS.find(o => o.value === value)!
                    return (
                      <td key={m.user_id} className="px-2 py-2 text-center">
                        <button
                          onClick={() => cycleRaci(task.id, m.user_id)}
                          className={`h-8 w-8 rounded-md text-xs font-bold transition-colors cursor-pointer mx-auto flex items-center justify-center ${
                            option.color || 'bg-surface-tertiary text-text-tertiary hover:bg-gray-200'
                          }`}
                          title={`${task.title} — ${m.first_name} ${m.last_name}: ${option.value}`}
                        >
                          {option.label}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-text-secondary">
        {RACI_OPTIONS.filter(o => o.value !== 'none').map(o => (
          <div key={o.value} className="flex items-center gap-1.5">
            <span className={`h-5 w-5 rounded text-[10px] font-bold flex items-center justify-center ${o.color}`}>
              {o.label}
            </span>
            <span className="capitalize">{o.value}</span>
          </div>
        ))}
      </div>
    </>
  )
}
