'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { SERVICES, EVENT_CATEGORIES } from '@/lib/constants'
import { Loader2, Calculator, Check } from 'lucide-react'

export function BudgetFormClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    event_id: null as number | null,
    event_type: 'conference',
    attendees: 500,
    duration_days: 1,
    venue_type: 'indoor',
    services: [] as string[],
    has_vip: false,
    has_government: false,
    has_international_speakers: false,
    notes: '',
  })

  // Pre-fill from event if event_id is in URL
  useEffect(() => {
    const eventId = searchParams.get('event_id')
    if (!eventId) return
    fetch(`/api/events/${eventId}`)
      .then(r => r.json())
      .then(({ data }) => {
        if (!data) return
        const start = data.start_date ? new Date(data.start_date) : null
        const end = data.end_date ? new Date(data.end_date) : null
        const durationDays = start && end ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))) : 1
        setForm(prev => ({
          ...prev,
          name: `${data.title} Budget`,
          event_id: data.id,
          attendees: data.expected_attendees || prev.attendees,
          duration_days: durationDays,
        }))
      })
      .catch(() => {})
  }, [searchParams])

  function update(field: string, value: unknown) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleService(key: string) {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(key) ? prev.services.filter(s => s !== key) : [...prev.services, key],
    }))
  }

  async function handleSubmit() {
    if (!form.name.trim() || form.services.length === 0) {
      setError('Please provide a name and select at least one service')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tools/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to calculate budget')
      const { id } = await res.json()
      router.push(`/tools/budget/${id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500'
  const labelCls = 'block text-sm font-medium text-text-primary mb-1.5'

  return (
    <>
      <PageHeader title="Calculate Budget" description="Enter event parameters to estimate an itemized budget" />

      <div className="bg-surface rounded-xl border border-border p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Budget Name *</label>
            <input type="text" className={inputCls} placeholder="e.g. LEAP 2026 Budget" value={form.name} onChange={e => update('name', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Event Type</label>
            <select className={inputCls} value={form.event_type} onChange={e => update('event_type', e.target.value)}>
              {EVENT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Expected Attendees</label>
            <input type="number" className={inputCls} min={1} value={form.attendees} onChange={e => update('attendees', parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className={labelCls}>Duration (Days)</label>
            <input type="number" className={inputCls} min={1} max={30} value={form.duration_days} onChange={e => update('duration_days', parseInt(e.target.value) || 1)} />
          </div>
          <div>
            <label className={labelCls}>Venue Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['indoor', 'outdoor', 'hybrid'] as const).map(t => (
                <button key={t} type="button" onClick={() => update('venue_type', t)} className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${form.venue_type === t ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-border bg-surface text-text-secondary hover:border-border-dark'}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className={labelCls}>Services to Budget *</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SERVICES.map(svc => {
              const selected = form.services.includes(svc.key)
              return (
                <button key={svc.key} type="button" onClick={() => toggleService(svc.key)} className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-all ${selected ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-border bg-surface text-text-secondary hover:border-border-dark'}`}>
                  {selected && <Check className="h-3.5 w-3.5 text-primary-500 shrink-0" />}
                  {svc.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-3">
          <label className={labelCls}>Modifiers</label>
          {[
            { key: 'has_vip', label: 'VIP guests (+30%)' },
            { key: 'has_government', label: 'Government involvement (+25%)' },
            { key: 'has_international_speakers', label: 'International speakers (+15% on production)' },
          ].map(opt => (
            <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form[opt.key as keyof typeof form] as boolean} onChange={e => update(opt.key, e.target.checked)} className="rounded border-border text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-text-primary">{opt.label}</span>
            </label>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end pt-4 border-t border-border">
          <button type="button" onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50 transition-colors">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Calculating...</> : <><Calculator className="h-4 w-4" />Calculate Budget</>}
          </button>
        </div>
      </div>
    </>
  )
}
