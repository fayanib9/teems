'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { formatDate } from '@/lib/utils'
import { ClipboardCheck, Check, X, MessageSquare } from 'lucide-react'

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
  created_at: string | null
  resolved_at: string | null
  event_title: string | null
  requester_first: string | null
  requester_last: string | null
  steps: Step[]
}

type Props = {
  approvals: Approval[]
  currentUserId: number
}

export function ApprovalsClient({ approvals, currentUserId }: Props) {
  const router = useRouter()
  const [actionModal, setActionModal] = useState<{ approval: Approval; action: 'approve' | 'reject' } | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const pending = approvals.filter(a => a.status === 'pending' || a.status === 'in_review')
  const resolved = approvals.filter(a => a.status !== 'pending' && a.status !== 'in_review')

  async function handleAction() {
    if (!actionModal) return
    setLoading(true)
    try {
      const res = await fetch(`/api/approvals/${actionModal.approval.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionModal.action, comment: comment || undefined }),
      })
      if (res.ok) {
        setActionModal(null)
        setComment('')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  function canAct(approval: Approval): boolean {
    return approval.steps.some(s => s.approver_id === currentUserId && s.status === 'pending')
  }

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Review and respond to pending approvals for your events"
      />

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Pending ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map(approval => (
              <div key={approval.id} className="bg-surface rounded-xl border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-text-primary">{approval.title}</h3>
                      <StatusBadge type="approval" value={approval.status || 'pending'} />
                    </div>
                    {approval.description && (
                      <p className="text-xs text-text-secondary mb-2">{approval.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-text-tertiary">
                      <span>{approval.event_title}</span>
                      <span>Type: {approval.type}</span>
                      <span>{formatDate(approval.created_at)}</span>
                    </div>

                    {/* Steps */}
                    {approval.steps.length > 0 && (
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {approval.steps.map(step => (
                          <div key={step.id} className="flex items-center gap-1 text-xs">
                            <span className={
                              step.status === 'approved' ? 'text-green-600' :
                              step.status === 'rejected' ? 'text-red-600' :
                              'text-text-tertiary'
                            }>
                              {step.approver_first} {step.approver_last}
                            </span>
                            <Badge color={
                              step.status === 'approved' ? 'green' :
                              step.status === 'rejected' ? 'red' :
                              'gray'
                            }>
                              {step.status || 'pending'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {canAct(approval) && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => { setActionModal({ approval, action: 'approve' }); setComment('') }}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => { setActionModal({ approval, action: 'reject' }); setComment('') }}
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-primary mb-3">Resolved ({resolved.length})</h2>
          <div className="space-y-3">
            {resolved.map(approval => (
              <div key={approval.id} className="bg-surface rounded-xl border border-border p-5 opacity-75">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-text-primary">{approval.title}</h3>
                  <StatusBadge type="approval" value={approval.status || 'pending'} />
                </div>
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span>{approval.event_title}</span>
                  <span>Type: {approval.type}</span>
                  <span>Resolved: {formatDate(approval.resolved_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {approvals.length === 0 && (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <ClipboardCheck className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No approvals found for your events.</p>
        </div>
      )}

      {/* Action Modal */}
      <Modal
        open={!!actionModal}
        onClose={() => setActionModal(null)}
        title={actionModal?.action === 'approve' ? 'Approve Request' : 'Reject Request'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            {actionModal?.action === 'approve'
              ? `Are you sure you want to approve "${actionModal?.approval.title}"?`
              : `Are you sure you want to reject "${actionModal?.approval.title}"?`
            }
          </p>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Comment <span className="text-text-tertiary">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Add a comment..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setActionModal(null)}>
              Cancel
            </Button>
            <Button
              variant={actionModal?.action === 'approve' ? 'primary' : 'danger'}
              size="sm"
              loading={loading}
              onClick={handleAction}
            >
              {actionModal?.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
