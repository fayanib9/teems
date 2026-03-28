'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate, getInitials } from '@/lib/utils'
import { Users, UserCog, Search } from 'lucide-react'
import Link from 'next/link'

type Resource = {
  id: number
  first_name: string
  last_name: string
  email: string
  role_name: string | null
  event_count: number
  task_total: number
  task_active: number
  task_done: number
  workload: 'green' | 'amber' | 'red'
}

type Assignment = {
  task_id: number
  task_title: string
  task_status: string | null
  task_priority: string | null
  task_due_date: Date | null
  event_id: number
  event_title: string | null
}

type Props = {
  resources: Resource[]
}

const workloadColors: Record<string, 'green' | 'amber' | 'red'> = {
  green: 'green',
  amber: 'amber',
  red: 'red',
}

const workloadLabels: Record<string, string> = {
  green: 'Light',
  amber: 'Moderate',
  red: 'Heavy',
}

export function ResourcesClient({ resources }: Props) {
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<Resource | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)

  const filtered = resources.filter(r =>
    !search ||
    `${r.first_name} ${r.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase())
  )

  const totalActive = resources.reduce((sum, r) => sum + r.task_active, 0)
  const heavyLoad = resources.filter(r => r.workload === 'red').length

  async function viewAssignments(user: Resource) {
    setSelectedUser(user)
    setLoadingAssignments(true)
    try {
      const res = await fetch(`/api/resources?user_id=${user.id}`)
      const json = await res.json()
      setAssignments(json.data || [])
    } catch {
      setAssignments([])
    } finally {
      setLoadingAssignments(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Resource Utilization"
        description="Team workload and assignment overview across all events"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard title="Team Members" value={resources.length} icon={Users} />
        <StatCard title="Active Tasks" value={totalActive} icon={UserCog} />
        <StatCard title="Heavy Workload" value={heavyLoad} subtitle="members overloaded" icon={UserCog} />
        <StatCard
          title="Avg Load"
          value={resources.length > 0 ? Math.round(totalActive / resources.length) : 0}
          subtitle="tasks per person"
          icon={UserCog}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search team members..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members found"
          description="No team members match your search."
        />
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Member</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Events</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Tasks (Done/Total)</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Active</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Workload</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr
                    key={user.id}
                    onClick={() => viewAssignments(user)}
                    className="border-b border-border-light hover:bg-surface-secondary cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 font-medium text-xs flex items-center justify-center shrink-0">
                          {getInitials(user.first_name, user.last_name)}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{user.first_name} {user.last_name}</div>
                          <div className="text-xs text-text-tertiary">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{user.role_name || '—'}</td>
                    <td className="px-4 py-3 text-text-secondary">{user.event_count}</td>
                    <td className="px-4 py-3 text-text-secondary">{user.task_done}/{user.task_total}</td>
                    <td className="px-4 py-3 text-text-primary font-medium">{user.task_active}</td>
                    <td className="px-4 py-3">
                      <Badge color={workloadColors[user.workload]}>
                        {workloadLabels[user.workload]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignments Detail Modal */}
      <Modal
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name} — Assignments` : ''}
        size="xl"
      >
        {loadingAssignments ? (
          <p className="text-sm text-text-secondary py-8 text-center">Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-text-secondary py-8 text-center">No task assignments found.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2 font-medium text-text-secondary">Task</th>
                  <th className="text-left px-3 py-2 font-medium text-text-secondary">Event</th>
                  <th className="text-left px-3 py-2 font-medium text-text-secondary">Status</th>
                  <th className="text-left px-3 py-2 font-medium text-text-secondary">Priority</th>
                  <th className="text-left px-3 py-2 font-medium text-text-secondary">Due</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.task_id} className="border-b border-border-light">
                    <td className="px-3 py-2 text-text-primary">{a.task_title}</td>
                    <td className="px-3 py-2">
                      <Link href={`/events/${a.event_id}`} className="text-primary-600 hover:underline text-xs">
                        {a.event_title}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      {a.task_status && <StatusBadge type="task" value={a.task_status} />}
                    </td>
                    <td className="px-3 py-2">
                      {a.task_priority && <StatusBadge type="priority" value={a.task_priority} />}
                    </td>
                    <td className="px-3 py-2 text-text-secondary text-xs">{formatDate(a.task_due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </>
  )
}
