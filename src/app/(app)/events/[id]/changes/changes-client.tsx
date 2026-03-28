'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { formatDate } from '@/lib/utils'
import { Plus, GitCompare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type ChangeRequest = {
  id: number
  title: string
  description: string | null
  change_type: string
  impact_assessment: string | null
  status: string | null
  requested_by: number | null
  approved_by: number | null
  approved_at: Date | null
  created_at: Date | null
  requester_first_name: string | null
  requester_last_name: string | null
}

type Props = {
  eventId: number
  eventTitle: string
  changes: ChangeRequest[]
  canManage: boolean
}

const statusColors: Record<string, 'amber' | 'green' | 'red' | 'blue' | 'gray'> = {
  pending: 'amber',
  approved: 'green',
  rejected: 'red',
  implemented: 'blue',
}

const changeTypes = [
  { value: 'scope', label: 'Scope Change' },
  { value: 'budget', label: 'Budget Change' },
  { value: 'schedule', label: 'Schedule Change' },
  { value: 'resource', label: 'Resource Change' },
]

export function ChangesClient({ eventId, eventTitle, changes: initialChanges, canManage }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [changes, setChanges] = useState(initialChanges)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    change_type: '',
    description: '',
    impact_assessment: '',
  })

  async function handleCreate() {
    if (!form.title || !form.change_type) {
      toast({ type: 'error', message: 'Title and type are required' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast({ type: 'success', message: 'Change request created' })
      setShowForm(false)
      setForm({ title: '', change_type: '', description: '', impact_assessment: '' })
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to create change request' })
    } finally {
      setSaving(false)
    }
  }

  async function handleAction(crId: number, status: string) {
    try {
      const res = await fetch(`/api/events/${eventId}/changes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ change_request_id: crId, status }),
      })
      if (!res.ok) throw new Error()
      toast({ type: 'success', message: `Change request ${status}` })
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to update change request' })
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-1">
        <Link href={`/events/${eventId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <p className="text-xs text-text-tertiary">{eventTitle}</p>
          <h1 className="text-xl font-semibold text-text-primary">Change Requests</h1>
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> New Request
          </Button>
        </div>
      </div>

      <p className="text-sm text-text-secondary mb-6 ml-12">Track scope, budget, schedule, and resource changes</p>

      {changes.length === 0 ? (
        <EmptyState
          icon={GitCompare}
          title="No change requests"
          description="No change requests have been submitted for this event yet."
          action={{ label: 'New Change Request', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-3">
          {changes.map(cr => (
            <div key={cr.id} className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-text-primary">{cr.title}</h3>
                    <Badge color={statusColors[cr.status || 'pending'] || 'gray'}>
                      {cr.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
                    <span className="capitalize">{cr.change_type} change</span>
                    <span>by {cr.requester_first_name} {cr.requester_last_name}</span>
                    <span>{formatDate(cr.created_at)}</span>
                  </div>
                </div>
                {canManage && cr.status === 'pending' && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleAction(cr.id, 'approved')}>
                      Approve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleAction(cr.id, 'rejected')}>
                      Reject
                    </Button>
                  </div>
                )}
              </div>
              {cr.description && (
                <p className="text-sm text-text-secondary mt-2">{cr.description}</p>
              )}
              {cr.impact_assessment && (
                <div className="mt-2 p-2 bg-surface-secondary rounded-md">
                  <p className="text-xs font-medium text-text-secondary mb-0.5">Impact Assessment</p>
                  <p className="text-sm text-text-primary">{cr.impact_assessment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Change Request Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Change Request" size="lg">
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g., Increase catering budget by 20%"
          />
          <Select
            label="Change Type"
            value={form.change_type}
            onChange={e => setForm(f => ({ ...f, change_type: e.target.value }))}
            options={changeTypes}
            placeholder="Select type..."
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe the change..."
          />
          <Textarea
            label="Impact Assessment"
            value={form.impact_assessment}
            onChange={e => setForm(f => ({ ...f, impact_assessment: e.target.value }))}
            placeholder="What is the impact of this change on the project?"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleCreate}>Submit Request</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
