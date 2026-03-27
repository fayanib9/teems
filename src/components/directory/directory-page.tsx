'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { Plus, Search, Edit, Trash2, Mail, Phone, Globe, CalendarDays, Truck, Mic, Presentation, Building2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Truck, Mic, Presentation, Building2, CalendarDays,
}

type DirectoryItem = {
  id: number
  name: string
  [key: string]: unknown
}

type FieldDef = {
  key: string
  label: string
  type?: string
  placeholder?: string
  options?: { value: string; label: string }[]
}

type CardFieldDef = {
  key: string
  style: 'title' | 'subtitle' | 'caption'
  transform?: 'capitalize' | 'replace_underscores'
}

type Props = {
  title: string
  iconName: string
  items: DirectoryItem[]
  apiPath: string
  fields: FieldDef[]
  cardFields: CardFieldDef[]
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

const CARD_STYLES: Record<CardFieldDef['style'], string> = {
  title: 'text-base font-semibold text-text-primary',
  subtitle: 'text-sm text-text-secondary',
  caption: 'text-xs text-text-tertiary',
}

function renderCardField(item: DirectoryItem, cf: CardFieldDef) {
  const val = item[cf.key]
  if (!val) return null
  let text = String(val)
  if (cf.transform === 'replace_underscores') text = text.replace(/_/g, ' ')
  if (cf.transform === 'capitalize' || cf.transform === 'replace_underscores') text = text.replace(/^\w/, s => s.toUpperCase())
  const Tag = cf.style === 'title' ? 'h3' : cf.style === 'subtitle' ? 'p' : 'span'
  return <Tag key={cf.key} className={CARD_STYLES[cf.style]}>{text}</Tag>
}

export function DirectoryPage({ title, iconName, items, apiPath, fields, cardFields, canCreate, canEdit, canDelete }: Props) {
  const Icon = ICON_MAP[iconName] || Building2
  const router = useRouter()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const filtered = search
    ? items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
    : items

  function openCreate() {
    setEditingId(null)
    const empty: Record<string, string> = {}
    fields.forEach(f => { empty[f.key] = '' })
    setForm(empty)
    setShowModal(true)
  }

  function openEdit(item: DirectoryItem) {
    setEditingId(item.id)
    const data: Record<string, string> = {}
    fields.forEach(f => { data[f.key] = String(item[f.key] || '') })
    setForm(data)
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name?.trim()) {
      toast({ type: 'error', message: 'Name is required' })
      return
    }
    setLoading(true)
    try {
      const url = editingId ? `${apiPath}/${editingId}` : apiPath
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error('Failed')
      toast({ type: 'success', message: editingId ? `${title.slice(0, -1)} updated` : `${title.slice(0, -1)} created` })
      setShowModal(false)
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to save' })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`${apiPath}/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast({ type: 'success', message: 'Removed' })
      setDeleteId(null)
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to remove' })
    }
  }

  return (
    <>
      <PageHeader
        title={title}
        description={`${items.length} ${title.toLowerCase()}`}
        actions={canCreate ? <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add {title.slice(0, -1)}</Button> : undefined}
      />

      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Icon}
          title={`No ${title.toLowerCase()} found`}
          description={search ? 'Try adjusting your search' : `Add your first ${title.slice(0, -1).toLowerCase()}`}
          action={canCreate ? { label: `Add ${title.slice(0, -1)}`, onClick: openCreate } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="bg-surface rounded-xl border border-border p-5 hover:border-primary-200 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  {cardFields.map(cf => renderCardField(item, cf))}
                </div>
                <div className="flex gap-1 shrink-0">
                  {canEdit && (
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-md hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary cursor-pointer">
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-md hover:bg-red-50 text-text-tertiary hover:text-red-500 cursor-pointer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-text-secondary">
                {typeof item.email === 'string' && item.email && (
                  <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-text-tertiary" /> {item.email}</p>
                )}
                {typeof item.phone === 'string' && item.phone && (
                  <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-text-tertiary" /> {item.phone}</p>
                )}
                {typeof item.website === 'string' && item.website && (
                  <p className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-text-tertiary" /> {item.website}</p>
                )}
              </div>
              {typeof item.event_count === 'number' && (
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-text-tertiary">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {item.event_count} event{item.event_count !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? `Edit ${title.slice(0, -1)}` : `New ${title.slice(0, -1)}`} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(f => (
            f.options ? (
              <div key={f.key} className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">{f.label}</label>
                <select
                  value={form[f.key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                >
                  <option value="">Select...</option>
                  {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ) : f.type === 'textarea' ? (
              <div key={f.key} className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">{f.label}</label>
                <textarea
                  value={form[f.key] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  rows={2}
                  placeholder={f.placeholder}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            ) : (
              <Input
                key={f.key}
                label={f.label}
                type={f.type || 'text'}
                value={form[f.key] || ''}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
              />
            )
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>{editingId ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Removal" size="sm">
        <p className="text-sm text-text-secondary mb-4">Are you sure? This item will be deactivated.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Remove</Button>
        </div>
      </Modal>
    </>
  )
}
