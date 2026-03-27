'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { formatDate, getInitials } from '@/lib/utils'
import { Search, Users, Shield } from 'lucide-react'

type User = {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string | null
  role_id: number | null
  user_type: string
  is_active: boolean | null
  last_login_at: Date | null
  created_at: Date | null
  role_name: string | null
  role_display: string | null
}

type Props = {
  users: User[]
  roles: { id: number; name: string; display_name: string }[]
}

export function UsersPageClient({ users, roles }: Props) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const filtered = users.filter(u => {
    const matchSearch = !search || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.role_name === roleFilter
    return matchSearch && matchRole
  })

  return (
    <>
      <PageHeader
        title="Users"
        description={`${users.length} user${users.length !== 1 ? 's' : ''}`}
      />

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-surface px-3 text-sm text-text-primary appearance-none cursor-pointer"
        >
          <option value="">All roles</option>
          {roles.map(r => <option key={r.name} value={r.name}>{r.display_name}</option>)}
        </select>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50">
              <th className="text-left px-4 py-2.5 font-medium text-text-secondary">User</th>
              <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Role</th>
              <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Type</th>
              <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Status</th>
              <th className="text-left px-4 py-2.5 font-medium text-text-secondary">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                      {getInitials(user.first_name, user.last_name)}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-text-tertiary">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge color="purple">{user.role_display || user.role_name || '—'}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge color={user.user_type === 'internal' ? 'blue' : 'amber'}>
                    {user.user_type}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge color={user.is_active ? 'green' : 'gray'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {user.last_login_at ? formatDate(user.last_login_at) : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-sm text-text-tertiary">No users match your filters</div>
        )}
      </div>
    </>
  )
}
