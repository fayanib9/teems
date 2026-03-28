'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Plus, UserCheck, Trash2, Check, X } from 'lucide-react'

type Role = {
  id: number
  name: string
  color: string | null
  description: string | null
}

export function RolesClient({ roles }: { roles: Role[] }) {
  const router = useRouter()
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: '', color: '#312C6A', description: '' })

  async function handleCreate() {
    if (!form.name.trim()) return
    await fetch('/api/tools/plan-roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ name: '', color: '#312C6A', description: '' })
    setShowNew(false)
    router.refresh()
  }

  async function handleDelete(id: number) {
    await fetch(`/api/tools/plan-roles/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <>
      <PageHeader
        title="Plan Roles"
        description="Manage roles assigned to tasks in generated plans"
        actions={
          <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
            <Plus className="h-4 w-4" />New Role
          </button>
        }
      />

      {showNew && (
        <div className="bg-surface rounded-xl border border-border p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <input type="text" placeholder="Role name" className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <input type="color" className="h-9 w-9 rounded border border-border cursor-pointer" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} />
            <input type="text" placeholder="Description" className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium"><Check className="h-4 w-4 inline mr-1" />Create</button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 text-text-secondary text-sm"><X className="h-4 w-4 inline mr-1" />Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {roles.map(role => (
          <div key={role.id} className="bg-surface rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${role.color}20` }}>
              <UserCheck className="h-4 w-4" style={{ color: role.color || '#6B7280' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{role.name}</p>
              {role.description && <p className="text-xs text-text-tertiary truncate">{role.description}</p>}
            </div>
            <button onClick={() => handleDelete(role.id)} className="text-text-tertiary hover:text-red-500 p-1">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
