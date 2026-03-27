'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBadge } from '@/components/ui/status-badge'
import { useToast } from '@/components/ui/toast'
import {
  ClipboardCheck, Plus, Search, Check, X, Clock,
  ChevronDown, ChevronRight, MessageSquare, User,
  CalendarDays, AlertCircle,
} from 'lucide-react'

const APPROVAL_TYPES = [
  { value: 'budget', label: 'Budget Approval' },
  { value: 'vendor', label: 'Vendor Selection' },
  { value: 'document', label: 'Document Review' },
  { value: 'change', label: 'Change Request' },
  { value: 'general', label: 'General Approval' },
]

type Step = {
  id: number
  approval_id: number
  step_order: number
  approver_id: number
  status: string | null
  comment: string | null
  decided_at: string | null
  approver_first: string | null
  approver_last: string | null
}

type Approval = {
  id: number
  title: string
  description: string | null
  type: string
  status: string | null
  event_id: number | null
  requested_by: number | null
  resolved_at: string | null
  created_at: string | null
  event_title: string | null
  requester_first: string | null
  requester_last: string | null
  steps: Step[]
}

type Props = {
  approvals: Approval[]
  events: { id: number; title: string }[]
  users: { id: number; first_name: string; last_name: string }[]
  currentUserId: number
  canCreate: boolean
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_ICONS: Record<string, typeof Check> = {
  approved: Check,
  rejected: X,
  pending: Clock,
}

const STEP_COLORS: Record<string, string> = {
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  pending: 'bg-gray-300',
}

export function ApprovalsClient({ approvals, events, users, currentUserId, canCreate }: Props) {
  const router = useRouter()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // Create form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('general')
  const [eventId, setEventId] = useState('')
  const [approverIds, setApproverIds] = useState<number[]>([])

  // Action modal state
  const [actionModal, setActionModal] = useState<{ approvalId: number; action: 'approve' | 'reject' } | null>(null)
  const [actionComment, setActionComment] = useState('')

  const filtered = approvals.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && a.status !== statusFilter) return false
    return true
  })

  const myPendingCount = approvals.filter(a =>
    a.status === 'pending' || a.status === 'in_review'
      ? a.steps.some(s => s.approver_id === currentUserId && s.status === 'pending')
      : false
  ).length

  function openCreate() {
    setTitle('')
    setDescription('')
    setType('general')
    setEventId('')
    setApproverIds([])
    setShowCreate(true)
  }

  function toggleApprover(userId: number) {
    setApproverIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      toast({ type: 'error', message: 'Title is required' })
      return
    }
    if (approverIds.length === 0) {
      toast({ type: 'error', message: 'Select at least one approver' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description || null,
          type,
          event_id: eventId || null,
          approver_ids: approverIds,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ type: 'success', message: 'Approval request created' })
      setShowCreate(false)
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to create' })
    } finally {
      setLoading(false)
    }
  }

  async function handleAction() {
    if (!actionModal) return
    setActionLoading(actionModal.approvalId)
    try {
      const res = await fetch(`/api/approvals/${actionModal.approvalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionModal.action,
          comment: actionComment || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast({ type: 'success', message: actionModal.action === 'approve' ? 'Approved' : 'Rejected' })
      setActionModal(null)
      setActionComment('')
      router.refresh()
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Failed' })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCancel(id: number) {
    try {
      const res = await fetch(`/api/approvals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast({ type: 'success', message: 'Approval cancelled' })
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to cancel' })
    }
  }

  function canActOn(approval: Approval) {
    if (approval.status !== 'pending' && approval.status !== 'in_review') return false
    const myStep = approval.steps.find(s => s.approver_id === currentUserId && s.status === 'pending')
    if (!myStep) return false
    // Check sequential: all previous steps must be approved
    const previousSteps = approval.steps.filter(s => s.step_order < myStep.step_order)
    return previousSteps.every(s => s.status === 'approved')
  }

  return (
    <>
      <PageHeader
        title="Approvals"
        description={`${approvals.length} request${approvals.length !== 1 ? 's' : ''}${myPendingCount > 0 ? ` · ${myPendingCount} awaiting your action` : ''}`}
        actions={canCreate ? <Button onClick={openCreate}><Plus className="h-4 w-4" /> New Request</Button> : undefined}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search approvals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Approval List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No approvals found"
          description={search || statusFilter ? 'Try adjusting your filters' : 'Create your first approval request'}
          action={canCreate ? { label: 'New Request', onClick: openCreate } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(approval => {
            const isExpanded = expandedId === approval.id
            const canAct = canActOn(approval)

            return (
              <div key={approval.id} className="bg-surface rounded-xl border border-border overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(isExpanded ? null : approval.id)}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-text-tertiary shrink-0" /> : <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-semibold text-text-primary truncate">{approval.title}</h3>
                      {canAct && (
                        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                          Action needed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-tertiary">
                      <span className="capitalize">{APPROVAL_TYPES.find(t => t.value === approval.type)?.label || approval.type}</span>
                      {approval.event_title && <span>· {approval.event_title}</span>}
                      <span>· {formatDate(approval.created_at)}</span>
                      {approval.requester_first && <span>· by {approval.requester_first} {approval.requester_last}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Step progress dots */}
                    <div className="flex gap-1 mr-2">
                      {approval.steps.map(step => (
                        <div
                          key={step.id}
                          className={`w-2.5 h-2.5 rounded-full ${STEP_COLORS[step.status || 'pending']}`}
                          title={`Step ${step.step_order}: ${step.approver_first} ${step.approver_last} — ${step.status}`}
                        />
                      ))}
                    </div>
                    <StatusBadge type="approval" value={approval.status || 'pending'} />
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4">
                    {approval.description && (
                      <p className="text-sm text-text-secondary mb-4">{approval.description}</p>
                    )}

                    {/* Approval Steps */}
                    <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">Approval Chain</h4>
                    <div className="space-y-2 mb-4">
                      {approval.steps.map((step, idx) => {
                        const StepIcon = STATUS_ICONS[step.status || 'pending'] || Clock
                        const isActive = step.status === 'pending' && (idx === 0 || approval.steps.slice(0, idx).every(s => s.status === 'approved'))

                        return (
                          <div key={step.id} className={`flex items-start gap-3 p-3 rounded-lg ${isActive ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                              step.status === 'approved' ? 'bg-green-100 text-green-600' :
                              step.status === 'rejected' ? 'bg-red-100 text-red-600' :
                              isActive ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-400'
                            }`}>
                              <StepIcon className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-text-primary">
                                  Step {step.step_order}: {step.approver_first} {step.approver_last}
                                </p>
                                <span className={`text-xs capitalize ${
                                  step.status === 'approved' ? 'text-green-600' :
                                  step.status === 'rejected' ? 'text-red-600' : 'text-text-tertiary'
                                }`}>
                                  {step.status}
                                </span>
                              </div>
                              {step.comment && (
                                <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" /> {step.comment}
                                </p>
                              )}
                              {step.decided_at && (
                                <p className="text-xs text-text-tertiary mt-0.5">{formatDate(step.decided_at)}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {canAct && (
                        <>
                          <Button size="sm" onClick={() => { setActionModal({ approvalId: approval.id, action: 'approve' }); setActionComment('') }}>
                            <Check className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => { setActionModal({ approvalId: approval.id, action: 'reject' }); setActionComment('') }}>
                            <X className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </>
                      )}
                      {approval.requested_by === currentUserId && (approval.status === 'pending' || approval.status === 'in_review') && (
                        <Button size="sm" variant="outline" onClick={() => handleCancel(approval.id)}>
                          Cancel Request
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Approval Request" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs approval?"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Provide context for the approvers"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                {APPROVAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">Event (optional)</label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="">No event</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
            </div>
          </div>

          {/* Approver Selection */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">
              Approval Chain <span className="text-text-tertiary font-normal">(select in order)</span>
            </label>
            <div className="border border-border rounded-md max-h-40 overflow-y-auto">
              {users.map(user => (
                <label
                  key={user.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-border last:border-0"
                >
                  <input
                    type="checkbox"
                    checked={approverIds.includes(user.id)}
                    onChange={() => toggleApprover(user.id)}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-text-primary">{user.first_name} {user.last_name}</span>
                  {approverIds.includes(user.id) && (
                    <span className="ml-auto text-xs text-primary-600 font-medium">
                      Step {approverIds.indexOf(user.id) + 1}
                    </span>
                  )}
                </label>
              ))}
            </div>
            {approverIds.length > 0 && (
              <p className="text-xs text-text-tertiary">
                {approverIds.length} approver{approverIds.length > 1 ? 's' : ''} selected (sequential approval)
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Submit Request</Button>
          </div>
        </form>
      </Modal>

      {/* Approve/Reject Modal */}
      <Modal
        open={!!actionModal}
        onClose={() => setActionModal(null)}
        title={actionModal?.action === 'approve' ? 'Approve Request' : 'Reject Request'}
        size="sm"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Comment (optional)</label>
            <textarea
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              rows={2}
              placeholder={actionModal?.action === 'approve' ? 'Any notes...' : 'Reason for rejection...'}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActionModal(null)}>Cancel</Button>
            {actionModal?.action === 'approve' ? (
              <Button onClick={handleAction} loading={!!actionLoading}>Approve</Button>
            ) : (
              <Button variant="danger" onClick={handleAction} loading={!!actionLoading}>Reject</Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
