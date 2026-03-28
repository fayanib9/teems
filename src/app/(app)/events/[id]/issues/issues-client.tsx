'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Plus, AlertTriangle, Filter } from 'lucide-react'

type Issue = {
  id: number
  title: string
  description: string | null
  severity: string | null
  status: string | null
  reported_by: number | null
  assigned_to: number | null
  resolution: string | null
  resolved_at: Date | null
  created_at: Date | null
}

type UserOption = { id: number; first_name: string; last_name: string }

type Props = {
  eventId: number
  eventTitle: string
  initialIssues: Issue[]
  users: UserOption[]
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

export function IssuesClient({ eventId, eventTitle, initialIssues, users }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [issues, setIssues] = useState(initialIssues)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [assignedTo, setAssignedTo] = useState('')

  function resetForm() {
    setTitle(''); setDescription(''); setSeverity('medium'); setAssignedTo('')
    setShowAdd(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description || null,
          severity,
          assigned_to: assignedTo ? Number(assignedTo) : null,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const issue = await res.json()
      setIssues(prev => [issue, ...prev])
      toast({ type: 'success', message: 'Issue reported' })
      resetForm()
    } catch {
      toast({ type: 'error', message: 'Failed to report issue' })
    } finally {
      setSaving(false)
    }
  }

  async function updateIssue(issueId: number, updates: Record<string, unknown>) {
    try {
      await fetch(`/api/events/${eventId}/issues`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue_id: issueId, ...updates }),
      })
      setIssues(prev => prev.map(issue =>
        issue.id === issueId ? {
          ...issue,
          ...updates,
          resolved_at: updates.status === 'resolved' ? new Date() : issue.resolved_at,
        } as Issue : issue
      ))
    } catch {
      toast({ type: 'error', message: 'Failed to update' })
    }
  }

  const filteredIssues = issues.filter(i => {
    if (filterSeverity && i.severity !== filterSeverity) return false
    if (filterStatus && i.status !== filterStatus) return false
    return true
  })

  const openCount = issues.filter(i => i.status !== 'resolved').length
  const inputCls = 'w-full h-9 px-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'

  return (
    <>
      <PageHeader
        title={`Issues — ${eventTitle}`}
        description={`${openCount} open issue${openCount !== 1 ? 's' : ''}`}
        actions={
          <Link href={`/events/${eventId}`} className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Event
          </Link>
        }
      />

      {/* Filters and Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-text-tertiary" />
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="h-8 px-2 rounded-md border border-border bg-surface text-xs text-text-primary">
            <option value="">All severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-8 px-2 rounded-md border border-border bg-surface text-xs text-text-primary">
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <Button size="sm" variant="danger" onClick={() => setShowAdd(true)}>
          <AlertTriangle className="h-3.5 w-3.5" /> Report Issue
        </Button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-red-200 p-4 space-y-3 mb-4">
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Issue title *" autoFocus className={inputCls} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue..." rows={3}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
          <div className="grid grid-cols-2 gap-2">
            <select value={severity} onChange={e => setSeverity(e.target.value)} className={inputCls}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className={inputCls}>
              <option value="">Assign to...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" type="button" onClick={resetForm}>Cancel</Button>
            <Button size="sm" variant="danger" type="submit" loading={saving}>Report</Button>
          </div>
        </form>
      )}

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="text-center py-16">
          <AlertTriangle className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
          <h3 className="text-base font-medium text-text-primary mb-1">No issues</h3>
          <p className="text-sm text-text-secondary">
            {issues.length > 0 ? 'No issues match the current filters.' : 'No issues reported yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredIssues.map(issue => (
            <div key={issue.id} className={`p-4 rounded-lg border ${
              issue.status === 'resolved' ? 'bg-green-50 border-green-200' : 'bg-surface border-border'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`text-sm font-medium ${issue.status === 'resolved' ? 'text-green-700' : 'text-text-primary'}`}>
                      {issue.title}
                    </h4>
                    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium ${SEVERITY_COLORS[issue.severity || 'medium']}`}>
                      {issue.severity}
                    </span>
                    <span className="text-[10px] text-text-tertiary px-1.5 py-0.5 bg-surface-tertiary rounded-full">
                      {STATUS_LABELS[issue.status || 'open'] || issue.status}
                    </span>
                  </div>
                  {issue.description && <p className="text-xs text-text-secondary mb-1">{issue.description}</p>}
                  {issue.resolution && <p className="text-xs text-green-600 mt-1">Resolution: {issue.resolution}</p>}
                  {issue.created_at && (
                    <p className="text-xs text-text-tertiary">
                      Reported {new Date(issue.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                {issue.status !== 'resolved' && (
                  <div className="flex gap-1 shrink-0">
                    {issue.status === 'open' && (
                      <button onClick={() => updateIssue(issue.id, { status: 'in_progress' })}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 cursor-pointer">Working</button>
                    )}
                    <button onClick={() => updateIssue(issue.id, { status: 'resolved' })}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 cursor-pointer">Resolve</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
