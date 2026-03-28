'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Download, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react'
import { timeAgo, getInitials, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

type ActivityLog = {
  id: number
  user_id: number | null
  event_id: number | null
  action: string
  resource: string
  resource_id: number | null
  details: string | null
  created_at: string | null
  user_first_name: string | null
  user_last_name: string | null
  event_title: string | null
  event_slug: string | null
}

type UserOption = {
  id: number
  name: string
}

type Props = {
  initialLogs: ActivityLog[]
  totalCount: number
  users: UserOption[]
}

const ACTIONS = ['created', 'updated', 'deleted', 'status_changed', 'assigned', 'uploaded', 'approved', 'rejected']
const RESOURCES = ['event', 'task', 'document', 'approval', 'vendor', 'speaker', 'exhibitor', 'team', 'user', 'settings']
const PAGE_SIZE = 20

export function ActivityClient({ initialLogs, totalCount, users }: Props) {
  const [logs, setLogs] = useState(initialLogs)
  const [total, setTotal] = useState(totalCount)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [filterUser, setFilterUser] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterResource, setFilterResource] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const totalPages = Math.ceil(total / PAGE_SIZE)

  async function fetchLogs(p: number) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String((p - 1) * PAGE_SIZE))
      if (filterUser) params.set('user_id', filterUser)
      if (filterAction) params.set('action', filterAction)
      if (filterResource) params.set('resource', filterResource)
      if (filterDateFrom) params.set('date_from', filterDateFrom)
      if (filterDateTo) params.set('date_to', filterDateTo)

      const res = await fetch(`/api/activity?${params.toString()}`)
      if (!res.ok) return
      const data = await res.json()
      setLogs(data.data || [])
      setTotal(data.total || 0)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    setPage(1)
    fetchLogs(1)
  }

  function clearFilters() {
    setFilterUser('')
    setFilterAction('')
    setFilterResource('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setPage(1)
    // fetch with cleared filters
    setLoading(true)
    fetch(`/api/activity?limit=${PAGE_SIZE}&offset=0`)
      .then(r => r.json())
      .then(data => { setLogs(data.data || []); setTotal(data.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  function goPage(p: number) {
    setPage(p)
    fetchLogs(p)
  }

  function exportCSV() {
    const header = ['Timestamp', 'User', 'Action', 'Resource', 'Details', 'Event']
    const rows = logs.map(log => [
      log.created_at ? new Date(log.created_at).toISOString() : '',
      log.user_first_name && log.user_last_name ? `${log.user_first_name} ${log.user_last_name}` : 'Unknown',
      log.action,
      log.resource,
      log.details || '',
      log.event_title || '',
    ])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasActiveFilters = filterUser || filterAction || filterResource || filterDateFrom || filterDateTo

  return (
    <div>
      <PageHeader
        title="Activity Log"
        description="Recent actions across the platform"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" /> Filters
              {hasActiveFilters && <span className="ml-1 h-2 w-2 rounded-full bg-primary-500" />}
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        }
      />

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-surface rounded-xl border border-border p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Filters</h3>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1">
                <X className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary">User</label>
              <select
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
                className="flex h-8 w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All users</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary">Action</label>
              <select
                value={filterAction}
                onChange={e => setFilterAction(e.target.value)}
                className="flex h-8 w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All actions</option>
                {ACTIONS.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary">Resource</label>
              <select
                value={filterResource}
                onChange={e => setFilterResource(e.target.value)}
                className="flex h-8 w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All resources</option>
                {RESOURCES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary">From</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="flex h-8 w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-text-secondary">To</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="flex h-8 w-full rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="primary" size="sm" onClick={applyFilters}>Apply Filters</Button>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-[140px_1fr_100px_100px_120px] gap-3 px-4 py-2.5 border-b border-border bg-surface-secondary text-xs font-medium text-text-tertiary uppercase tracking-wider">
          <span>Timestamp</span>
          <span>Activity</span>
          <span>Action</span>
          <span>Resource</span>
          <span>Event</span>
        </div>

        {loading && (
          <div className="py-12 text-center">
            <p className="text-sm text-text-tertiary">Loading...</p>
          </div>
        )}

        {!loading && logs.length === 0 && (
          <p className="text-sm text-text-tertiary py-12 text-center">No activity recorded yet.</p>
        )}

        {!loading && logs.map((log) => {
          const initials =
            log.user_first_name && log.user_last_name
              ? getInitials(log.user_first_name, log.user_last_name)
              : '??'
          const userName =
            log.user_first_name && log.user_last_name
              ? `${log.user_first_name} ${log.user_last_name}`
              : 'Unknown user'

          return (
            <div
              key={log.id}
              className="flex sm:grid sm:grid-cols-[140px_1fr_100px_100px_120px] gap-3 px-4 py-3 border-b border-border-light last:border-0 hover:bg-surface-secondary transition-colors items-center"
            >
              {/* Timestamp */}
              <span className="hidden sm:block text-xs text-text-tertiary">
                {log.created_at ? formatDateTime(log.created_at) : '--'}
              </span>

              {/* Activity */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="h-7 w-7 rounded-full bg-primary-100 text-primary-700 font-medium text-[10px] flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-text-primary truncate">
                    <span className="font-medium">{userName}</span>{' '}
                    <span className="text-text-secondary">{log.action} a {log.resource}</span>
                  </p>
                  {log.details && (
                    <p className="text-xs text-text-tertiary truncate">{log.details}</p>
                  )}
                  <span className="sm:hidden text-xs text-text-tertiary">
                    {log.created_at ? timeAgo(log.created_at) : '--'}
                  </span>
                </div>
              </div>

              {/* Action */}
              <span className="hidden sm:block text-xs text-text-secondary capitalize">{log.action.replace(/_/g, ' ')}</span>

              {/* Resource */}
              <span className="hidden sm:block text-[11px] font-medium text-text-tertiary bg-surface-tertiary px-2 py-0.5 rounded capitalize w-fit">
                {log.resource}
              </span>

              {/* Event */}
              <span className="hidden sm:block">
                {log.event_title && log.event_id ? (
                  <Link
                    href={`/events/${log.event_id}`}
                    className="text-xs text-primary-600 hover:text-primary-700 hover:underline truncate block"
                  >
                    {log.event_title}
                  </Link>
                ) : (
                  <span className="text-xs text-text-tertiary">--</span>
                )}
              </span>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-text-tertiary">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => goPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p: number
              if (totalPages <= 5) {
                p = i + 1
              } else if (page <= 3) {
                p = i + 1
              } else if (page >= totalPages - 2) {
                p = totalPages - 4 + i
              } else {
                p = page - 2 + i
              }
              return (
                <Button
                  key={p}
                  variant={p === page ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => goPage(p)}
                  className="w-8 h-8"
                >
                  {p}
                </Button>
              )
            })}
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
