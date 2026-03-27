'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { getInitials } from '@/lib/utils'
import { Plus, Users, User, Crown } from 'lucide-react'

type Team = {
  id: number
  name: string
  description: string | null
  lead_id: number | null
  color: string | null
  created_at: Date | null
  lead_first_name: string | null
  lead_last_name: string | null
  member_count: number
}

type Props = {
  teams: Team[]
  users: { id: number; first_name: string; last_name: string }[]
  canCreate: boolean
  canEdit: boolean
}

const COLORS = ['#312C6A', '#2563EB', '#059669', '#D97706', '#DC2626', '#6B7280', '#EC4899']

export function TeamsPageClient({ teams, users, canCreate, canEdit }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', lead_id: '', color: '#312C6A' })
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast({ type: 'error', message: 'Team name is required' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          lead_id: form.lead_id ? parseInt(form.lead_id) : null,
          color: form.color,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ type: 'success', message: 'Team created' })
      setShowModal(false)
      setForm({ name: '', description: '', lead_id: '', color: '#312C6A' })
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to create team' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Teams"
        description={`${teams.length} team${teams.length !== 1 ? 's' : ''}`}
        actions={canCreate ? <Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" /> New Team</Button> : undefined}
      />

      {teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Create teams to organize your workforce and assign them to events"
          action={canCreate ? { label: 'New Team', onClick: () => setShowModal(true) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <div key={team.id} className="bg-surface rounded-xl border border-border p-5 hover:border-primary-200 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: team.color || '#312C6A' }}
                >
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-text-primary">{team.name}</h3>
                  {team.description && (
                    <p className="text-sm text-text-secondary truncate">{team.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <User className="h-3.5 w-3.5" />
                  {team.member_count} member{team.member_count !== 1 ? 's' : ''}
                </span>
                {team.lead_first_name && (
                  <span className="flex items-center gap-1.5 text-text-tertiary text-xs">
                    <Crown className="h-3 w-3" />
                    {team.lead_first_name} {team.lead_last_name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Team" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Team Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <Select
            label="Team Lead"
            options={users.map(u => ({ value: String(u.id), label: `${u.first_name} ${u.last_name}` }))}
            placeholder="Select lead..."
            value={form.lead_id}
            onChange={e => setForm(f => ({ ...f, lead_id: e.target.value }))}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`h-8 w-8 rounded-full cursor-pointer transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Create Team</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
