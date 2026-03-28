'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { SERVICES, BUDGET_RANGES, EVENT_CATEGORIES } from '@/lib/constants'
import { Loader2, GitCompare, Check } from 'lucide-react'

export function MatchFormClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    event_id: null as number | null,
    services_needed: [] as string[],
    budget_range: '500k_2m',
    event_type: 'conference',
    attendees: 500,
    event_date: '',
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
        setForm(prev => ({
          ...prev,
          event_id: data.id,
          attendees: data.expected_attendees || prev.attendees,
          event_date: start ? start.toISOString().split('T')[0] : prev.event_date,
        }))
      })
      .catch(() => {})
  }, [searchParams])

  function toggleService(key: string) {
    setForm(prev => ({
      ...prev,
      services_needed: prev.services_needed.includes(key)
        ? prev.services_needed.filter(s => s !== key)
        : [...prev.services_needed, key],
    }))
  }

  async function handleSubmit() {
    if (form.services_needed.length === 0) { setError('Select at least one service'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tools/vendor-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to match vendors')
      const { id } = await res.json()
      router.push(`/tools/vendors/${id}`)
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
      <PageHeader title="Find Vendors" description="Specify your requirements to find the best-matching vendors" />

      <div className="bg-surface rounded-xl border border-border p-6 space-y-6">
        <div>
          <label className={labelCls}>Services Needed *</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {SERVICES.map(svc => {
              const selected = form.services_needed.includes(svc.key)
              return (
                <button key={svc.key} type="button" onClick={() => toggleService(svc.key)} className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-all ${selected ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-border text-text-secondary hover:border-border-dark'}`}>
                  {selected && <Check className="h-3.5 w-3.5 text-primary-500 shrink-0" />}
                  {svc.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Event Type</label>
            <select className={inputCls} value={form.event_type} onChange={e => setForm(prev => ({ ...prev, event_type: e.target.value }))}>
              {EVENT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Budget Range</label>
            <select className={inputCls} value={form.budget_range} onChange={e => setForm(prev => ({ ...prev, budget_range: e.target.value }))}>
              {BUDGET_RANGES.map(br => <option key={br.key} value={br.key}>{br.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Expected Attendees</label>
            <input type="number" className={inputCls} min={1} value={form.attendees} onChange={e => setForm(prev => ({ ...prev, attendees: parseInt(e.target.value) || 0 }))} />
          </div>
          <div>
            <label className={labelCls}>Event Date</label>
            <input type="date" className={inputCls} value={form.event_date} onChange={e => setForm(prev => ({ ...prev, event_date: e.target.value }))} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end pt-4 border-t border-border">
          <button type="button" onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50 transition-colors">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Matching...</> : <><GitCompare className="h-4 w-4" />Find Vendors</>}
          </button>
        </div>
      </div>
    </>
  )
}
