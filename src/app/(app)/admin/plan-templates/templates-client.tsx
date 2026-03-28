'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Plus, LayoutTemplate, Layers, ListChecks, Check, X } from 'lucide-react'

type Template = {
  id: number
  name: string
  description: string | null
  event_type: string | null
  is_default: boolean | null
  phase_count: number
  task_count: number
}

export function TemplatesClient({ templates }: { templates: Template[] }) {
  const router = useRouter()
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', event_type: '' })
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!form.name.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/tools/plan-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/admin/plan-templates/${data.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Plan Templates"
        description="Manage project plan templates with phases and tasks"
        actions={
          <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
            <Plus className="h-4 w-4" />New Template
          </button>
        }
      />

      {showNew && (
        <div className="bg-surface rounded-xl border border-border p-5 mb-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">New Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input type="text" placeholder="Template name" className="px-3 py-2 bg-surface border border-border rounded-lg text-sm" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <input type="text" placeholder="Event type (optional)" className="px-3 py-2 bg-surface border border-border rounded-lg text-sm" value={form.event_type} onChange={e => setForm(p => ({ ...p, event_type: e.target.value }))} />
            <input type="text" placeholder="Description" className="px-3 py-2 bg-surface border border-border rounded-lg text-sm" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              <Check className="h-4 w-4 inline mr-1" />Create
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 text-text-secondary hover:text-text-primary text-sm">
              <X className="h-4 w-4 inline mr-1" />Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => (
          <Link key={t.id} href={`/admin/plan-templates/${t.id}`} className="bg-surface rounded-xl border border-border p-5 hover:border-primary-300 transition-colors group">
            <div className="flex items-start justify-between mb-3">
              <div className="rounded-lg bg-primary-50 p-2">
                <LayoutTemplate className="h-5 w-5 text-primary-500" />
              </div>
              {t.is_default && <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">Default</span>}
            </div>
            <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary-600 mb-1">{t.name}</h3>
            {t.description && <p className="text-xs text-text-tertiary mb-3 line-clamp-2">{t.description}</p>}
            {t.event_type && <p className="text-xs text-text-secondary capitalize mb-3">{t.event_type}</p>}
            <div className="flex items-center gap-4 text-xs text-text-tertiary">
              <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{t.phase_count} phases</span>
              <span className="flex items-center gap-1"><ListChecks className="h-3 w-3" />{t.task_count} tasks</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
