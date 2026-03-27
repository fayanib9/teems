'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { Plus, Search, Building2, Mail, Phone, MapPin, Globe, CalendarDays, Edit, Trash2 } from 'lucide-react'

type Client = {
  id: number
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  website: string | null
  notes: string | null
  event_count: number
  created_at: Date | null
}

type Props = {
  clients: Client[]
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

const emptyClient = { name: '', contact_name: '', email: '', phone: '', address: '', city: '', country: '', website: '', notes: '' }

export function ClientsListClient({ clients, canCreate, canEdit, canDelete }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyClient)
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const filtered = search
    ? clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
      )
    : clients

  function openCreate() {
    setEditingId(null)
    setForm(emptyClient)
    setShowModal(true)
  }

  function openEdit(client: Client) {
    setEditingId(client.id)
    setForm({
      name: client.name,
      contact_name: client.contact_name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      country: client.country || '',
      website: client.website || '',
      notes: client.notes || '',
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast({ type: 'error', message: 'Name is required' })
      return
    }
    setLoading(true)
    try {
      const url = editingId ? `/api/clients/${editingId}` : '/api/clients'
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast({ type: 'success', message: editingId ? 'Client updated' : 'Client created' })
      setShowModal(false)
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to save client' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/clients/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast({ type: 'success', message: 'Client removed' })
      setDeleteId(null)
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to delete client' })
    }
  }

  return (
    <>
      <PageHeader
        title="Clients"
        description={`${clients.length} client${clients.length !== 1 ? 's' : ''}`}
        actions={canCreate ? <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Client</Button> : undefined}
      />

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clients found"
          description={search ? 'Try adjusting your search' : 'Add your first client to link them to events'}
          action={canCreate ? { label: 'Add Client', onClick: openCreate } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => (
            <div key={client.id} className="bg-surface rounded-xl border border-border p-5 hover:border-primary-200 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">{client.name}</h3>
                  {client.contact_name && (
                    <p className="text-sm text-text-secondary">{client.contact_name}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {canEdit && (
                    <button onClick={() => openEdit(client)} className="p-1.5 rounded-md hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary cursor-pointer">
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => setDeleteId(client.id)} className="p-1.5 rounded-md hover:bg-red-50 text-text-tertiary hover:text-red-500 cursor-pointer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-text-secondary">
                {client.email && (
                  <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-text-tertiary" /> {client.email}</p>
                )}
                {client.phone && (
                  <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-text-tertiary" /> {client.phone}</p>
                )}
                {(client.city || client.country) && (
                  <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-text-tertiary" /> {[client.city, client.country].filter(Boolean).join(', ')}</p>
                )}
                {client.website && (
                  <p className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-text-tertiary" /> {client.website}</p>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-text-tertiary">
                <CalendarDays className="h-3.5 w-3.5" />
                {client.event_count} event{client.event_count !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Client' : 'New Client'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Company Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Contact Person" value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} />
            <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Input label="Website" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            <Input label="Country" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>{editingId ? 'Update' : 'Create'} Client</Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Client" size="sm">
        <p className="text-sm text-text-secondary mb-4">
          Are you sure? The client will be deactivated but their linked events will remain.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Remove</Button>
        </div>
      </Modal>
    </>
  )
}
