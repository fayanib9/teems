'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { SERVICES, BUDGET_RANGES, URGENCY_LEVELS, EVENT_CATEGORIES } from '@/lib/constants'
import {
  ArrowLeft, ArrowRight, Loader2, Wand2,
  Film, FileText, UserCheck, UtensilsCrossed,
  Palette, Truck, Users as UsersIcon, Megaphone,
  Check,
} from 'lucide-react'

type Props = {
  eventTypes: { id: number; name: string }[]
  clients: { id: number; name: string }[]
}

const SERVICE_ICONS: Record<string, React.ElementType> = {
  production: Film,
  content: FileText,
  registration: UserCheck,
  catering: UtensilsCrossed,
  branding: Palette,
  logistics: Truck,
  staffing: UsersIcon,
  marketing: Megaphone,
}

const STEPS = ['General', 'Scale', 'Services', 'Budget', 'Timeline', 'Special', 'Review']

type FormData = {
  project_name: string
  client_name: string
  client_id: number | null
  event_id: number | null
  event_type: string
  event_date: string
  duration_days: number
  attendees: number
  audience_type: string
  venue_type: string
  zones_count: number
  services: string[]
  budget_range: string
  days_remaining: number
  urgency: string
  has_vip: boolean
  has_government: boolean
  has_international_speakers: boolean
  has_custom_builds: boolean
  notes: string
}

export function WizardClient({ eventTypes, clients }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [prefilling, setPrefilling] = useState(false)

  const [form, setForm] = useState<FormData>({
    project_name: '',
    client_name: '',
    client_id: null,
    event_id: null,
    event_type: 'conference',
    event_date: '',
    duration_days: 1,
    attendees: 500,
    audience_type: 'public',
    venue_type: 'indoor',
    zones_count: 1,
    services: [],
    budget_range: '500k_2m',
    days_remaining: 90,
    urgency: 'normal',
    has_vip: false,
    has_government: false,
    has_international_speakers: false,
    has_custom_builds: false,
    notes: '',
  })

  // Pre-fill from event if event_id is in URL
  useEffect(() => {
    const eventId = searchParams.get('event_id')
    if (!eventId) return
    setPrefilling(true)
    fetch(`/api/events/${eventId}`)
      .then(r => r.json())
      .then(({ data }) => {
        if (!data) return
        const start = data.start_date ? new Date(data.start_date) : null
        const end = data.end_date ? new Date(data.end_date) : null
        const durationDays = start && end ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))) : 1
        const eventDate = start ? start.toISOString().split('T')[0] : ''
        const daysRemaining = start ? Math.max(0, Math.ceil((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 90
        setForm(prev => ({
          ...prev,
          project_name: data.title || prev.project_name,
          client_name: data.client_name || prev.client_name,
          client_id: data.client_id || prev.client_id,
          event_id: data.id,
          event_date: eventDate,
          duration_days: durationDays,
          attendees: data.expected_attendees || prev.attendees,
          venue_type: data.venue_name?.toLowerCase().includes('outdoor') ? 'outdoor' : 'indoor',
          days_remaining: daysRemaining,
        }))
      })
      .catch(() => {})
      .finally(() => setPrefilling(false))
  }, [searchParams])

  function update(field: string, value: unknown) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'event_date' && typeof value === 'string' && value) {
        const eventDate = new Date(value)
        const today = new Date()
        const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        next.days_remaining = Math.max(0, diff)
      }
      return next
    })
  }

  function toggleService(key: string) {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(key)
        ? prev.services.filter((s) => s !== key)
        : [...prev.services, key],
    }))
  }

  function canNext() {
    switch (step) {
      case 0: return form.project_name.trim() && form.client_name.trim() && form.event_type && form.event_date
      case 1: return form.attendees > 0 && form.duration_days > 0
      case 2: return form.services.length > 0
      case 3: return !!form.budget_range
      case 4: return !!form.urgency
      case 5: return true
      default: return true
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/tools/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate plan')
      }
      const { id } = await res.json()
      router.push(`/tools/planner/${id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
  const labelCls = 'block text-sm font-medium text-text-primary mb-1.5'

  return (
    <>
      <PageHeader
        title="Generate Project Plan"
        description="Answer a few questions about your event to generate a comprehensive project plan"
      />

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                i === step
                  ? 'text-primary-600'
                  : i < step
                    ? 'text-text-secondary cursor-pointer hover:text-primary-500'
                    : 'text-text-tertiary cursor-not-allowed opacity-50'
              }`}
            >
              {i < step && <Check className="h-3 w-3 text-green-500" />}
              {s}
            </button>
          ))}
        </div>
        <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6">
        {/* Step 0: General */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-text-primary">Project Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Project Name *</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. LEAP 2026 Conference"
                  value={form.project_name}
                  onChange={(e) => update('project_name', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Client *</label>
                <select
                  className={inputCls}
                  value={form.client_id || ''}
                  onChange={(e) => {
                    const id = e.target.value ? parseInt(e.target.value) : null
                    const client = clients.find((c) => c.id === id)
                    update('client_id', id)
                    update('client_name', client?.name || '')
                  }}
                >
                  <option value="">Select client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {!form.client_id && (
                  <input
                    type="text"
                    className={`${inputCls} mt-2`}
                    placeholder="Or type client name"
                    value={form.client_name}
                    onChange={(e) => update('client_name', e.target.value)}
                  />
                )}
              </div>
              <div>
                <label className={labelCls}>Event Type *</label>
                <select
                  className={inputCls}
                  value={form.event_type}
                  onChange={(e) => update('event_type', e.target.value)}
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Event Date *</label>
                <input
                  type="date"
                  className={inputCls}
                  value={form.event_date}
                  onChange={(e) => update('event_date', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Scale */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-text-primary">Scale & Venue</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Expected Attendees *</label>
                <input
                  type="number"
                  className={inputCls}
                  min={1}
                  value={form.attendees}
                  onChange={(e) => update('attendees', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className={labelCls}>Duration (Days) *</label>
                <input
                  type="number"
                  className={inputCls}
                  min={1}
                  max={30}
                  value={form.duration_days}
                  onChange={(e) => update('duration_days', parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <label className={labelCls}>Audience Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['vip', 'public', 'internal', 'mixed'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update('audience_type', t)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        form.audience_type === t
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-border bg-surface text-text-secondary hover:border-border-dark'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Venue Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['indoor', 'outdoor', 'hybrid'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => update('venue_type', t)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        form.venue_type === t
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-border bg-surface text-text-secondary hover:border-border-dark'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Number of Zones</label>
                <input
                  type="number"
                  className={inputCls}
                  min={1}
                  max={50}
                  value={form.zones_count}
                  onChange={(e) => update('zones_count', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Services */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-text-primary">Required Services</h2>
            <p className="text-sm text-text-secondary">Select all services needed for this event</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SERVICES.map((svc) => {
                const Icon = SERVICE_ICONS[svc.key] || FileText
                const selected = form.services.includes(svc.key)
                return (
                  <button
                    key={svc.key}
                    type="button"
                    onClick={() => toggleService(svc.key)}
                    className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                      selected
                        ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200'
                        : 'border-border bg-surface hover:border-border-dark'
                    }`}
                  >
                    <div className={`rounded-lg p-2 ${selected ? 'bg-primary-100' : 'bg-surface-tertiary'}`}>
                      <Icon className={`h-4 w-4 ${selected ? 'text-primary-600' : 'text-text-tertiary'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${selected ? 'text-primary-700' : 'text-text-primary'}`}>
                          {svc.label}
                        </span>
                        {selected && <Check className="h-4 w-4 text-primary-500" />}
                      </div>
                      <p className="text-xs text-text-tertiary mt-0.5">{svc.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3: Budget */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-text-primary">Budget Range</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BUDGET_RANGES.map((br) => (
                <button
                  key={br.key}
                  type="button"
                  onClick={() => update('budget_range', br.key)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    form.budget_range === br.key
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200'
                      : 'border-border bg-surface hover:border-border-dark'
                  }`}
                >
                  <span className={`text-sm font-medium ${
                    form.budget_range === br.key ? 'text-primary-700' : 'text-text-primary'
                  }`}>
                    {br.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Timeline */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-text-primary">Timeline & Urgency</h2>
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Days Until Event</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    className={`${inputCls} max-w-[140px]`}
                    min={1}
                    value={form.days_remaining}
                    onChange={(e) => update('days_remaining', parseInt(e.target.value) || 0)}
                  />
                  <span className="text-sm text-text-tertiary">days remaining</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>Urgency Level</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {URGENCY_LEVELS.map((u) => (
                    <button
                      key={u.key}
                      type="button"
                      onClick={() => update('urgency', u.key)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        form.urgency === u.key
                          ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200'
                          : 'border-border bg-surface hover:border-border-dark'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: u.color }} />
                        <span className={`text-sm font-medium ${
                          form.urgency === u.key ? 'text-primary-700' : 'text-text-primary'
                        }`}>
                          {u.label}
                        </span>
                      </div>
                      <p className="text-xs text-text-tertiary">{u.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Special Requirements */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-text-primary">Special Requirements</h2>
            <div className="space-y-3">
              {[
                { key: 'has_vip', label: 'VIP Attendance', desc: 'Event will have VIP guests requiring special protocols' },
                { key: 'has_government', label: 'Government Involvement', desc: 'Government officials or agencies are involved' },
                { key: 'has_international_speakers', label: 'International Speakers', desc: 'Speakers traveling from abroad, requiring visa/logistics' },
                { key: 'has_custom_builds', label: 'Custom Builds', desc: 'Custom stage, booths, or structural elements needed' },
              ].map((opt) => (
                <label
                  key={opt.key}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    form[opt.key as keyof FormData]
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-border bg-surface hover:border-border-dark'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form[opt.key as keyof FormData] as boolean}
                    onChange={(e) => update(opt.key, e.target.checked)}
                    className="mt-0.5 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-text-primary">{opt.label}</span>
                    <p className="text-xs text-text-tertiary mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div>
              <label className={labelCls}>Additional Notes</label>
              <textarea
                className={`${inputCls} min-h-[80px]`}
                placeholder="Any additional context or requirements..."
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {step === 6 && (
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-text-primary">Review & Generate</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface-secondary rounded-lg p-4">
                <p className="text-xs font-medium text-text-tertiary uppercase mb-2">Project</p>
                <p className="text-sm font-medium text-text-primary">{form.project_name}</p>
                <p className="text-sm text-text-secondary">{form.client_name}</p>
              </div>
              <div className="bg-surface-secondary rounded-lg p-4">
                <p className="text-xs font-medium text-text-tertiary uppercase mb-2">Event</p>
                <p className="text-sm font-medium text-text-primary capitalize">{form.event_type}</p>
                <p className="text-sm text-text-secondary">{form.event_date} &middot; {form.duration_days} day(s)</p>
              </div>
              <div className="bg-surface-secondary rounded-lg p-4">
                <p className="text-xs font-medium text-text-tertiary uppercase mb-2">Scale</p>
                <p className="text-sm font-medium text-text-primary">{form.attendees.toLocaleString()} attendees</p>
                <p className="text-sm text-text-secondary capitalize">{form.venue_type} &middot; {form.audience_type} &middot; {form.zones_count} zone(s)</p>
              </div>
              <div className="bg-surface-secondary rounded-lg p-4">
                <p className="text-xs font-medium text-text-tertiary uppercase mb-2">Budget & Timeline</p>
                <p className="text-sm font-medium text-text-primary">
                  {BUDGET_RANGES.find(b => b.key === form.budget_range)?.label}
                </p>
                <p className="text-sm text-text-secondary">{form.days_remaining} days remaining &middot; {URGENCY_LEVELS.find(u => u.key === form.urgency)?.label}</p>
              </div>
            </div>
            <div className="bg-surface-secondary rounded-lg p-4">
              <p className="text-xs font-medium text-text-tertiary uppercase mb-2">Services ({form.services.length})</p>
              <div className="flex flex-wrap gap-2">
                {form.services.map((s) => (
                  <span key={s} className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs font-medium">
                    {SERVICES.find(svc => svc.key === s)?.label || s}
                  </span>
                ))}
              </div>
            </div>
            {(form.has_vip || form.has_government || form.has_international_speakers || form.has_custom_builds) && (
              <div className="bg-surface-secondary rounded-lg p-4">
                <p className="text-xs font-medium text-text-tertiary uppercase mb-2">Special Requirements</p>
                <div className="flex flex-wrap gap-2">
                  {form.has_vip && <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-medium">VIP</span>}
                  {form.has_government && <span className="px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs font-medium">Government</span>}
                  {form.has_international_speakers && <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">Intl Speakers</span>}
                  {form.has_custom_builds && <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium">Custom Builds</span>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Generate Plan
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
