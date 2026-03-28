'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import {
  ArrowLeft, Plus, Clock, MapPin, PlayCircle, Check, X, Trash2, Edit,
} from 'lucide-react'

type RunSheetItem = {
  id: number
  title: string
  description: string | null
  scheduled_time: Date | null
  duration_minutes: number | null
  location: string | null
  responsible_user_id: number | null
  status: string | null
  sort_order: number | null
  notes: string | null
  completed_at: Date | null
  responsible_name: string | null
}

type UserOption = { id: number; first_name: string; last_name: string }

type Props = {
  eventId: number
  eventTitle: string
  initialItems: RunSheetItem[]
  users: UserOption[]
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-200',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  skipped: 'bg-gray-400',
}

export function RunSheetClient({ eventId, eventTitle, initialItems, users }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [items, setItems] = useState(initialItems)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [durationMin, setDurationMin] = useState('')
  const [location, setLocation] = useState('')
  const [responsibleId, setResponsibleId] = useState('')
  const [notes, setNotes] = useState('')

  function resetForm() {
    setTitle(''); setDescription(''); setScheduledTime(''); setDurationMin('')
    setLocation(''); setResponsibleId(''); setNotes('')
    setEditingId(null)
    setShowAdd(false)
  }

  function startEdit(item: RunSheetItem) {
    setEditingId(item.id)
    setTitle(item.title)
    setDescription(item.description || '')
    setScheduledTime(item.scheduled_time ? new Date(item.scheduled_time).toISOString().slice(0, 16) : '')
    setDurationMin(item.duration_minutes?.toString() || '')
    setLocation(item.location || '')
    setResponsibleId(item.responsible_user_id?.toString() || '')
    setNotes(item.notes || '')
    setShowAdd(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)

    if (editingId) {
      // Update via PATCH
      try {
        const res = await fetch(`/api/events/${eventId}/run-sheet`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: editingId,
            title: title.trim(),
            description: description || null,
            scheduled_time: scheduledTime || null,
            duration_minutes: durationMin ? Number(durationMin) : null,
            location: location || null,
            responsible_user_id: responsibleId ? Number(responsibleId) : null,
            notes: notes || null,
          }),
        })
        if (!res.ok) throw new Error('Failed')
        toast({ type: 'success', message: 'Item updated' })
        router.refresh()
        resetForm()
      } catch {
        toast({ type: 'error', message: 'Failed to update' })
      }
    } else {
      // Create via POST
      try {
        const res = await fetch(`/api/events/${eventId}/run-sheet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            description: description || null,
            scheduled_time: scheduledTime || null,
            duration_minutes: durationMin ? Number(durationMin) : null,
            location: location || null,
            responsible_user_id: responsibleId ? Number(responsibleId) : null,
            sort_order: items.length,
          }),
        })
        if (!res.ok) throw new Error('Failed')
        const item = await res.json()
        setItems(prev => [...prev, { ...item, responsible_name: users.find(u => u.id === Number(responsibleId))?.first_name || null }])
        toast({ type: 'success', message: 'Item added' })
        resetForm()
      } catch {
        toast({ type: 'error', message: 'Failed to add' })
      }
    }
    setSaving(false)
  }

  async function updateStatus(itemId: number, status: string) {
    try {
      await fetch(`/api/events/${eventId}/run-sheet`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, status }),
      })
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, status, completed_at: status === 'completed' ? new Date() : null } : item
      ))
    } catch {
      toast({ type: 'error', message: 'Failed to update' })
    }
  }

  async function deleteItem(itemId: number) {
    try {
      await fetch(`/api/events/${eventId}/run-sheet`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, status: 'deleted' }),
      })
      setItems(prev => prev.filter(i => i.id !== itemId))
      toast({ type: 'success', message: 'Item removed' })
    } catch {
      toast({ type: 'error', message: 'Failed to remove' })
    }
  }

  const completedCount = items.filter(i => i.status === 'completed').length
  const inputCls = 'w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'

  return (
    <>
      <PageHeader
        title={`Run Sheet — ${eventTitle}`}
        description="Manage event-day schedule items"
        actions={
          <Link href={`/events/${eventId}`} className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Event
          </Link>
        }
      />

      {/* Progress */}
      {items.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-text-secondary">{completedCount}/{items.length} completed</span>
            <span className="text-sm font-medium text-text-primary">{Math.round((completedCount / items.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${(completedCount / items.length) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => { resetForm(); setShowAdd(true) }}>
          <Plus className="h-3.5 w-3.5" /> Add Item
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <form onSubmit={handleSave} className="bg-surface rounded-xl border border-border p-4 space-y-3 mb-4">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Item title *" autoFocus className={inputCls} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input type="datetime-local" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} className={inputCls} />
            <input type="number" value={durationMin} onChange={e => setDurationMin(e.target.value)} placeholder="Duration (min)" className={inputCls} />
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" className={inputCls} />
            <select value={responsibleId} onChange={e => setResponsibleId(e.target.value)} className={inputCls}>
              <option value="">Responsible</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
            </select>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" rows={1}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" type="button" onClick={resetForm}>Cancel</Button>
            <Button size="sm" type="submit" loading={saving}>{editingId ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      )}

      {/* Items List */}
      {items.length === 0 && !showAdd ? (
        <div className="text-center py-16">
          <PlayCircle className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
          <h3 className="text-base font-medium text-text-primary mb-1">No run sheet items</h3>
          <p className="text-sm text-text-secondary">Build your event-day schedule by adding items above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
              item.status === 'completed' ? 'bg-green-50 border-green-200' :
              item.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
              item.status === 'skipped' ? 'bg-gray-50 border-gray-200 opacity-60' :
              'bg-surface border-border'
            }`}>
              <div className={`w-3 h-3 rounded-full shrink-0 ${STATUS_COLORS[item.status || 'pending']}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.status === 'completed' ? 'text-green-700 line-through' : 'text-text-primary'}`}>
                  {item.title}
                </p>
                {item.description && <p className="text-xs text-text-secondary mt-0.5">{item.description}</p>}
                <div className="flex items-center gap-3 text-xs text-text-tertiary mt-0.5">
                  {item.scheduled_time && (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(item.scheduled_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                  {item.duration_minutes && <span>{item.duration_minutes}min</span>}
                  {item.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.location}</span>}
                  {item.responsible_name && <span>{item.responsible_name}</span>}
                  {item.notes && <span>Note: {item.notes}</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {item.status !== 'completed' && item.status !== 'skipped' && (
                  <>
                    {item.status !== 'in_progress' && (
                      <button onClick={() => updateStatus(item.id, 'in_progress')} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 cursor-pointer">Start</button>
                    )}
                    <button onClick={() => updateStatus(item.id, 'completed')} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 cursor-pointer">Done</button>
                    <button onClick={() => updateStatus(item.id, 'skipped')} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 cursor-pointer">Skip</button>
                  </>
                )}
                <button onClick={() => startEdit(item)} className="p-1 text-text-tertiary hover:text-text-primary cursor-pointer">
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => deleteItem(item.id)} className="p-1 text-red-400 hover:text-red-600 cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
