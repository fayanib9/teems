'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
  Trash2,
} from 'lucide-react'

type TimesheetEntry = {
  id: number
  user_id: number
  event_id: number | null
  task_id: number | null
  date: string
  hours: number // minutes
  description: string | null
  billable: boolean | null
  status: string | null
  approved_by: number | null
  approved_at: string | null
  created_at: string | null
  event_title: string | null
  task_title: string | null
}

type EventItem = { id: number; title: string }
type TaskItem = { id: number; title: string; event_id: number }

type Props = {
  entries: TimesheetEntry[]
  events: EventItem[]
  tasks: TaskItem[]
  weekStart: string
  currentUserId: number
}

type RowKey = string // `${event_id}-${task_id}`

type CellEdit = {
  rowKey: RowKey
  dayIndex: number
  entryId: number | null
  minutes: number
  description: string
  billable: boolean
  status: string
  event_id: number | null
  task_id: number | null
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const STATUS_CONFIG: Record<string, { color: 'gray' | 'blue' | 'green' | 'red'; icon: typeof Clock }> = {
  draft: { color: 'gray', icon: FileEdit },
  submitted: { color: 'blue', icon: Send },
  approved: { color: 'green', icon: CheckCircle2 },
  rejected: { color: 'red', icon: XCircle },
}

function getWeekDates(weekStartStr: string): Date[] {
  const start = new Date(weekStartStr)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

function parseHoursInput(value: string): number {
  // Accept formats: "2" (hours), "2.5" (hours), "2:30" (h:mm), "90m" (minutes)
  const trimmed = value.trim()
  if (!trimmed) return 0

  // Minutes format: "90m"
  if (trimmed.endsWith('m')) {
    const mins = parseInt(trimmed.slice(0, -1))
    return isNaN(mins) ? 0 : Math.max(0, mins)
  }

  // Colon format: "2:30"
  if (trimmed.includes(':')) {
    const [h, m] = trimmed.split(':').map(Number)
    return (isNaN(h) ? 0 : h * 60) + (isNaN(m) ? 0 : m)
  }

  // Decimal hours: "2.5"
  const hours = parseFloat(trimmed)
  return isNaN(hours) ? 0 : Math.max(0, Math.round(hours * 60))
}

function minutesToInput(minutes: number): string {
  if (minutes === 0) return ''
  const h = minutes / 60
  if (Number.isInteger(h)) return `${h}`
  return (Math.round(h * 100) / 100).toString()
}

function dateToISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function TimesheetClient({ entries, events, tasks, weekStart, currentUserId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [editingCell, setEditingCell] = useState<CellEdit | null>(null)
  const [showAddRow, setShowAddRow] = useState(false)
  const [newRowEventId, setNewRowEventId] = useState('')
  const [newRowTaskId, setNewRowTaskId] = useState('')

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])

  // Build rows from entries: group by event_id + task_id
  const rows = useMemo(() => {
    const rowMap = new Map<RowKey, {
      event_id: number | null
      task_id: number | null
      event_title: string
      task_title: string
      cells: (TimesheetEntry | null)[]
    }>()

    for (const entry of entries) {
      const key: RowKey = `${entry.event_id ?? 'none'}-${entry.task_id ?? 'none'}`
      if (!rowMap.has(key)) {
        rowMap.set(key, {
          event_id: entry.event_id,
          task_id: entry.task_id,
          event_title: entry.event_title || 'No Event',
          task_title: entry.task_title || '',
          cells: Array(7).fill(null),
        })
      }

      const row = rowMap.get(key)!
      const entryDate = new Date(entry.date)
      const dayIndex = weekDates.findIndex(d => dateToISO(d) === dateToISO(entryDate))
      if (dayIndex >= 0) {
        row.cells[dayIndex] = entry
      }
    }

    return Array.from(rowMap.entries()).map(([key, row]) => ({ key, ...row }))
  }, [entries, weekDates])

  // Calculate totals
  const dayTotals = useMemo(() => {
    const totals = Array(7).fill(0)
    for (const row of rows) {
      for (let i = 0; i < 7; i++) {
        if (row.cells[i]) totals[i] += row.cells[i]!.hours
      }
    }
    return totals
  }, [rows])

  const weekTotal = dayTotals.reduce((a, b) => a + b, 0)

  // Navigation
  function navigateWeek(direction: -1 | 1) {
    const current = new Date(weekStart)
    current.setDate(current.getDate() + direction * 7)
    router.push(`/timesheets?week_start=${dateToISO(current)}`)
  }

  function navigateToday() {
    router.push('/timesheets')
  }

  // Week label
  const weekLabel = useMemo(() => {
    const start = weekDates[0]
    const end = weekDates[6]
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' })
    const year = end.getFullYear()
    if (startMonth === endMonth) {
      return `${start.getDate()} - ${end.getDate()} ${startMonth} ${year}`
    }
    return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${year}`
  }, [weekDates])

  // Cell click
  function handleCellClick(rowKey: RowKey, dayIndex: number, entry: TimesheetEntry | null, row: typeof rows[0]) {
    // Don't allow editing non-draft entries
    if (entry && entry.status !== 'draft') return

    setEditingCell({
      rowKey,
      dayIndex,
      entryId: entry?.id || null,
      minutes: entry?.hours || 0,
      description: entry?.description || '',
      billable: entry?.billable ?? true,
      status: entry?.status || 'draft',
      event_id: row.event_id,
      task_id: row.task_id,
    })
  }

  // Save cell
  async function saveCell() {
    if (!editingCell) return
    setLoading(true)
    try {
      const { entryId, minutes, description, billable, event_id, task_id, dayIndex } = editingCell
      const date = dateToISO(weekDates[dayIndex])

      if (entryId && minutes === 0) {
        // Delete entry
        const res = await fetch(`/api/timesheets/${entryId}`, { method: 'DELETE' })
        if (!res.ok) {
          const data = await res.json()
          toast({ type: 'error', message: data.error || 'Failed to delete' })
          return
        }
      } else if (entryId) {
        // Update entry
        const res = await fetch(`/api/timesheets/${entryId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hours: minutes, description: description || null, billable }),
        })
        if (!res.ok) {
          const data = await res.json()
          toast({ type: 'error', message: data.error || 'Failed to update' })
          return
        }
      } else if (minutes > 0) {
        // Create entry
        const res = await fetch('/api/timesheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_id: event_id || null,
            task_id: task_id || null,
            date,
            hours: minutes,
            description: description || null,
            billable,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          toast({ type: 'error', message: data.error || 'Failed to create' })
          return
        }
      }

      setEditingCell(null)
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  // Add row
  function handleAddRow() {
    if (!newRowEventId) {
      toast({ type: 'error', message: 'Select an event' })
      return
    }
    // Check if row already exists
    const key = `${newRowEventId}-${newRowTaskId || 'none'}`
    const exists = rows.some(r => r.key === key)
    if (exists) {
      toast({ type: 'error', message: 'This event/task combination already exists' })
      return
    }
    // Create a placeholder entry for Monday to establish the row
    const eventItem = events.find(e => e.id === parseInt(newRowEventId))
    const taskItem = newRowTaskId ? tasks.find(t => t.id === parseInt(newRowTaskId)) : null

    // Open cell editor for Monday of this new row
    setEditingCell({
      rowKey: key,
      dayIndex: 0,
      entryId: null,
      minutes: 0,
      description: '',
      billable: true,
      status: 'draft',
      event_id: parseInt(newRowEventId),
      task_id: newRowTaskId ? parseInt(newRowTaskId) : null,
    })
    setShowAddRow(false)
    setNewRowEventId('')
    setNewRowTaskId('')
  }

  // Submit week
  async function submitWeek() {
    const draftEntries = entries.filter(e => e.status === 'draft')
    if (draftEntries.length === 0) {
      toast({ type: 'error', message: 'No draft entries to submit' })
      return
    }
    setLoading(true)
    try {
      let errors = 0
      for (const entry of draftEntries) {
        const res = await fetch(`/api/timesheets/${entry.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'submitted' }),
        })
        if (!res.ok) errors++
      }
      if (errors > 0) {
        toast({ type: 'error', message: `${errors} entries failed to submit` })
      } else {
        toast({ type: 'success', message: `${draftEntries.length} entries submitted` })
      }
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  // Tasks filtered by selected event in add row
  const filteredTasks = useMemo(() => {
    if (!newRowEventId) return []
    return tasks.filter(t => t.event_id === parseInt(newRowEventId))
  }, [newRowEventId, tasks])

  const hasDraftEntries = entries.some(e => e.status === 'draft')

  return (
    <div>
      <PageHeader
        title="Timesheets"
        description="Track time spent on events and tasks"
        actions={
          <div className="flex items-center gap-2">
            {hasDraftEntries && (
              <Button variant="primary" onClick={submitWeek} loading={loading}>
                <Send className="h-4 w-4" />
                Submit Week
              </Button>
            )}
          </div>
        }
      />

      {/* Week Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 bg-surface rounded-lg border border-border p-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={navigateToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-sm font-medium text-text-primary">{weekLabel}</h2>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Clock className="h-4 w-4" />
          <span className="font-medium">{formatMinutes(weekTotal)}</span>
          <span>total</span>
        </div>
      </div>

      {/* Timesheet Grid */}
      <div className="bg-surface rounded-lg border border-border overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-text-secondary px-4 py-3 w-[250px]">
                Event / Task
              </th>
              {weekDates.map((date, i) => {
                const isToday = dateToISO(date) === dateToISO(new Date())
                return (
                  <th
                    key={i}
                    className={`text-center text-xs font-medium px-2 py-3 w-[90px] ${
                      isToday ? 'text-primary-600 bg-primary-50/50 dark:bg-primary-900/20' : 'text-text-secondary'
                    }`}
                  >
                    <div>{DAY_NAMES[i]}</div>
                    <div className="text-[10px] mt-0.5">{date.getDate()}</div>
                  </th>
                )
              })}
              <th className="text-center text-xs font-medium text-text-secondary px-2 py-3 w-[80px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-sm text-text-secondary py-12">
                  No time entries this week. Add a row to get started.
                </td>
              </tr>
            )}
            {rows.map(row => {
              const rowTotal = row.cells.reduce((sum, cell) => sum + (cell?.hours || 0), 0)
              return (
                <tr key={row.key} className="border-b border-border hover:bg-surface-secondary/50">
                  <td className="px-4 py-2">
                    <div className="text-sm font-medium text-text-primary truncate max-w-[230px]">
                      {row.event_title}
                    </div>
                    {row.task_title && (
                      <div className="text-xs text-text-secondary truncate max-w-[230px]">
                        {row.task_title}
                      </div>
                    )}
                  </td>
                  {row.cells.map((cell, dayIndex) => {
                    const status = cell?.status || 'draft'
                    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
                    const isEditable = !cell || cell.status === 'draft'
                    return (
                      <td
                        key={dayIndex}
                        className={`text-center px-1 py-2 ${
                          isEditable ? 'cursor-pointer hover:bg-surface-tertiary/60' : ''
                        } ${dateToISO(weekDates[dayIndex]) === dateToISO(new Date()) ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                        onClick={() => handleCellClick(row.key, dayIndex, cell, row)}
                      >
                        {cell && cell.hours > 0 ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-sm font-medium text-text-primary">
                              {formatMinutes(cell.hours)}
                            </span>
                            <Badge color={config.color} className="text-[9px] px-1.5 py-0">
                              {status}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-xs text-text-secondary/40">-</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="text-center px-2 py-2">
                    <span className="text-sm font-semibold text-text-primary">
                      {rowTotal > 0 ? formatMinutes(rowTotal) : '-'}
                    </span>
                  </td>
                </tr>
              )
            })}
            {/* Totals row */}
            {rows.length > 0 && (
              <tr className="bg-surface-secondary/50">
                <td className="px-4 py-2 text-sm font-semibold text-text-primary">Daily Total</td>
                {dayTotals.map((total, i) => (
                  <td key={i} className="text-center px-2 py-2">
                    <span className={`text-sm font-semibold ${total > 0 ? 'text-text-primary' : 'text-text-secondary/40'}`}>
                      {total > 0 ? formatMinutes(total) : '-'}
                    </span>
                  </td>
                ))}
                <td className="text-center px-2 py-2">
                  <span className="text-sm font-bold text-primary-600">
                    {weekTotal > 0 ? formatMinutes(weekTotal) : '-'}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Row Button */}
      <div className="mt-3">
        <Button variant="ghost" size="sm" onClick={() => setShowAddRow(true)}>
          <Plus className="h-4 w-4" />
          Add Row
        </Button>
      </div>

      {/* Add Row Modal */}
      <Modal open={showAddRow} onClose={() => setShowAddRow(false)} title="Add Event / Task Row">
        <div className="space-y-4">
          <Select
            label="Event"
            value={newRowEventId}
            onChange={(e) => {
              setNewRowEventId(e.target.value)
              setNewRowTaskId('')
            }}
            placeholder="Select event..."
            options={events.map(ev => ({ value: String(ev.id), label: ev.title }))}
          />
          {filteredTasks.length > 0 && (
            <Select
              label="Task (optional)"
              value={newRowTaskId}
              onChange={(e) => setNewRowTaskId(e.target.value)}
              placeholder="No specific task"
              options={filteredTasks.map(t => ({ value: String(t.id), label: t.title }))}
            />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowAddRow(false)}>Cancel</Button>
            <Button onClick={handleAddRow}>Add Row</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Cell Modal */}
      <Modal
        open={editingCell !== null}
        onClose={() => setEditingCell(null)}
        title={editingCell ? `${DAY_NAMES[editingCell.dayIndex]} ${weekDates[editingCell.dayIndex]?.getDate() ?? ''}` : 'Edit Entry'}
        size="sm"
      >
        {editingCell && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Hours
              </label>
              <Input
                placeholder="e.g. 2.5 or 2:30 or 150m"
                value={minutesToInput(editingCell.minutes)}
                onChange={(e) => setEditingCell({
                  ...editingCell,
                  minutes: parseHoursInput(e.target.value),
                })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveCell()
                }}
                autoFocus
              />
              <p className="text-xs text-text-secondary mt-1">
                Enter as hours (2.5), h:mm (2:30), or minutes (150m)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Description
              </label>
              <Input
                placeholder="What did you work on?"
                value={editingCell.description}
                onChange={(e) => setEditingCell({ ...editingCell, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="billable"
                checked={editingCell.billable}
                onChange={(e) => setEditingCell({ ...editingCell, billable: e.target.checked })}
                className="rounded border-border"
              />
              <label htmlFor="billable" className="text-sm text-text-primary">
                Billable
              </label>
            </div>
            <div className="flex justify-between items-center pt-2">
              <div>
                {editingCell.entryId && editingCell.minutes > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const res = await fetch(`/api/timesheets/${editingCell.entryId}`, { method: 'DELETE' })
                        if (res.ok) {
                          setEditingCell(null)
                          router.refresh()
                        } else {
                          const data = await res.json()
                          toast({ type: 'error', message: data.error || 'Failed to delete' })
                        }
                      } catch {
                        toast({ type: 'error', message: 'Network error' })
                      } finally {
                        setLoading(false)
                      }
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingCell(null)}>Cancel</Button>
                <Button onClick={saveCell} loading={loading}>Save</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-text-secondary">
        {Object.entries(STATUS_CONFIG).map(([key, { color }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <Badge color={color} className="text-[9px] px-1.5 py-0">{key}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
