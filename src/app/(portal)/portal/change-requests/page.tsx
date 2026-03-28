'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate, timeAgo } from '@/lib/utils'
import {
  GitBranch, Plus, Clock, CheckCircle2, XCircle, AlertCircle,
  FileText,
} from 'lucide-react'

type ChangeRequest = {
  id: number
  event_id: number
  event_title: string
  title: string
  description: string
  priority: string
  status: string
  impact_description: string | null
  requested_timeline: string | null
  response_notes: string | null
  responded_at: string | null
  responded_by_name: string | null
  created_at: string
}

type EventOption = { id: number; title: string }

const PRIORITY_COLORS: Record<string, 'gray' | 'blue' | 'amber' | 'red'> = {
  low: 'gray',
  medium: 'blue',
  high: 'amber',
  urgent: 'red',
}

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  submitted: { icon: Clock, color: 'text-amber-500', label: 'Pending Review' },
  under_review: { icon: AlertCircle, color: 'text-blue-500', label: 'Under Review' },
  approved: { icon: CheckCircle2, color: 'text-green-500', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-500', label: 'Rejected' },
  implemented: { icon: CheckCircle2, color: 'text-primary-500', label: 'Implemented' },
}

export default function PortalChangeRequestsPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([])
  const [events, setEvents] = useState<EventOption[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null)
  const [filter, setFilter] = useState<string>('all')

  // Form state
  const [formEventId, setFormEventId] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPriority, setFormPriority] = useState('medium')
  const [formImpact, setFormImpact] = useState('')
  const [formTimeline, setFormTimeline] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [reqRes, evtRes] = await Promise.all([
        fetch('/api/portal/change-requests'),
        fetch('/api/portal/events'),
      ])
      if (reqRes.ok) {
        const data = await reqRes.json()
        setRequests(data.data || [])
      }
      if (evtRes.ok) {
        const data = await evtRes.json()
        setEvents((data.data || data || []).map((e: { id: number; title: string }) => ({ id: e.id, title: e.title })))
      }
    } catch { /* silent */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formEventId || !formTitle.trim() || !formDescription.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/portal/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: Number(formEventId),
          title: formTitle,
          description: formDescription,
          priority: formPriority,
          impact_description: formImpact || undefined,
          requested_timeline: formTimeline || undefined,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setFormEventId('')
        setFormTitle('')
        setFormDescription('')
        setFormPriority('medium')
        setFormImpact('')
        setFormTimeline('')
        fetchData()
      }
    } catch { /* silent */ }
    setSubmitting(false)
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const statusCounts = {
    all: requests.length,
    submitted: requests.filter(r => r.status === 'submitted').length,
    under_review: requests.filter(r => r.status === 'under_review').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Change Requests" description="Request changes to your events" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface rounded-xl border border-border p-5 animate-pulse">
              <div className="h-4 bg-surface-tertiary rounded w-1/3 mb-2" />
              <div className="h-3 bg-surface-tertiary rounded w-2/3" />
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Change Requests"
        description="Submit and track changes to your events"
        actions={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Request
          </Button>
        }
      />

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {Object.entries(statusCounts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-primary-50 text-primary-700'
                : 'text-text-secondary hover:bg-surface-tertiary'
            }`}
          >
            {key === 'all' ? 'All' : key === 'under_review' ? 'Under Review' : key.charAt(0).toUpperCase() + key.slice(1)}
            {count > 0 && <span className="ml-1.5 text-text-tertiary">({count})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <GitBranch className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm font-medium text-text-primary mb-1">No change requests</p>
          <p className="text-xs text-text-secondary mb-4">Submit a request when you need changes to your event</p>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-3.5 w-3.5 mr-1" /> Submit Request
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => {
            const statusInfo = STATUS_CONFIG[req.status] || STATUS_CONFIG.submitted
            const StatusIcon = statusInfo.icon
            return (
              <button
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className="w-full text-left bg-surface rounded-xl border border-border p-5 hover:border-primary-200 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusIcon className={`h-4 w-4 ${statusInfo.color} shrink-0`} />
                      <p className="text-sm font-medium text-text-primary truncate">{req.title}</p>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2 ml-6">{req.description}</p>
                    <div className="flex items-center gap-3 mt-2 ml-6">
                      <Badge color="gray" className="text-[10px]">{req.event_title}</Badge>
                      <Badge color={PRIORITY_COLORS[req.priority] || 'gray'} className="text-[10px]">
                        {req.priority}
                      </Badge>
                      <span className="text-[11px] text-text-tertiary">{timeAgo(req.created_at)}</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={selectedRequest?.title || 'Change Request'}
      >
        {selectedRequest && (() => {
          const statusInfo = STATUS_CONFIG[selectedRequest.status] || STATUS_CONFIG.submitted
          const StatusIcon = statusInfo.icon
          return (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                <span className="text-sm font-medium">{statusInfo.label}</span>
                <Badge color={PRIORITY_COLORS[selectedRequest.priority] || 'gray'}>
                  {selectedRequest.priority} priority
                </Badge>
              </div>

              <div>
                <p className="text-xs font-medium text-text-tertiary mb-1">Event</p>
                <p className="text-sm text-text-primary">{selectedRequest.event_title}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-text-tertiary mb-1">Description</p>
                <p className="text-sm text-text-primary whitespace-pre-wrap">{selectedRequest.description}</p>
              </div>

              {selectedRequest.impact_description && (
                <div>
                  <p className="text-xs font-medium text-text-tertiary mb-1">Expected Impact</p>
                  <p className="text-sm text-text-primary">{selectedRequest.impact_description}</p>
                </div>
              )}

              {selectedRequest.requested_timeline && (
                <div>
                  <p className="text-xs font-medium text-text-tertiary mb-1">Requested Timeline</p>
                  <p className="text-sm text-text-primary">{selectedRequest.requested_timeline}</p>
                </div>
              )}

              {selectedRequest.response_notes && (
                <div className="bg-surface-secondary rounded-lg p-4 border border-border-light">
                  <p className="text-xs font-medium text-text-tertiary mb-1">Team Response</p>
                  <p className="text-sm text-text-primary whitespace-pre-wrap">{selectedRequest.response_notes}</p>
                  {selectedRequest.responded_by_name && (
                    <p className="text-[11px] text-text-tertiary mt-2">
                      — {selectedRequest.responded_by_name}, {selectedRequest.responded_at && formatDate(selectedRequest.responded_at)}
                    </p>
                  )}
                </div>
              )}

              <p className="text-[11px] text-text-tertiary">
                Submitted {formatDate(selectedRequest.created_at)}
              </p>
            </div>
          )
        })()}
      </Modal>

      {/* Submit Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Submit Change Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Event</label>
            <select
              value={formEventId}
              onChange={(e) => setFormEventId(e.target.value)}
              required
              className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select event...</option>
              {events.map(evt => (
                <option key={evt.id} value={evt.id}>{evt.title}</option>
              ))}
            </select>
          </div>

          <Input
            label="Title"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Brief summary of the change"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Description</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Describe the change you're requesting..."
              rows={4}
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Priority</label>
            <select
              value={formPriority}
              onChange={(e) => setFormPriority(e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Expected Impact</label>
            <textarea
              value={formImpact}
              onChange={(e) => setFormImpact(e.target.value)}
              placeholder="How does this change impact budget, timeline, or scope? (optional)"
              rows={2}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <Input
            label="Requested Timeline"
            value={formTimeline}
            onChange={(e) => setFormTimeline(e.target.value)}
            placeholder="When do you need this change? (optional)"
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>
              <FileText className="h-4 w-4 mr-1.5" /> Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
