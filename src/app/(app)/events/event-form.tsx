'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { EVENT_STATUSES, PRIORITIES } from '@/lib/constants'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

type EventFormData = {
  title: string
  description: string
  event_type_id: string
  client_id: string
  status: string
  priority: string
  start_date: string
  end_date: string
  venue_name: string
  venue_address: string
  venue_city: string
  venue_country: string
  expected_attendees: string
  budget_estimated: string
  notes: string
}

type Props = {
  eventTypes: { id: number; name: string; color: string | null; icon: string | null }[]
  clients: { id: number; name: string }[]
  initialData?: EventFormData & { id: number }
}

const emptyForm: EventFormData = {
  title: '',
  description: '',
  event_type_id: '',
  client_id: '',
  status: 'draft',
  priority: 'medium',
  start_date: '',
  end_date: '',
  venue_name: '',
  venue_address: '',
  venue_city: '',
  venue_country: '',
  expected_attendees: '',
  budget_estimated: '',
  notes: '',
}

export function EventForm({ eventTypes, clients, initialData }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const isEdit = !!initialData
  const [form, setForm] = useState<EventFormData>(initialData || emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({})
  const [loading, setLoading] = useState(false)

  function update(field: keyof EventFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof EventFormData, string>> = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.start_date) errs.start_date = 'Start date is required'
    if (!form.end_date) errs.end_date = 'End date is required'
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      errs.end_date = 'End date must be after start date'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_type_id: form.event_type_id ? parseInt(form.event_type_id) : null,
        client_id: form.client_id ? parseInt(form.client_id) : null,
        status: form.status,
        priority: form.priority,
        start_date: form.start_date,
        end_date: form.end_date,
        venue_name: form.venue_name.trim() || null,
        venue_address: form.venue_address.trim() || null,
        venue_city: form.venue_city.trim() || null,
        venue_country: form.venue_country.trim() || null,
        expected_attendees: form.expected_attendees ? parseInt(form.expected_attendees) : null,
        budget_estimated: form.budget_estimated ? parseInt(form.budget_estimated) * 100 : null, // convert SAR to halalas
        notes: form.notes.trim() || null,
      }

      const url = isEdit ? `/api/events/${initialData!.id}` : '/api/events'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save event')
      }

      const { data } = await res.json()
      toast({ type: 'success', message: isEdit ? 'Event updated' : 'Event created' })
      router.push(`/events/${data.id}`)
      router.refresh()
    } catch (err: unknown) {
      toast({ type: 'error', message: (err as Error).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit Event' : 'New Event'}
        description={isEdit ? 'Update event details' : 'Create a new event'}
        actions={
          <Link href={isEdit ? `/events/${initialData!.id}` : '/events'}>
            <Button variant="ghost"><ArrowLeft className="h-4 w-4" /> Back</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
        {/* Basic Info */}
        <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Basic Information</h2>
          <Input
            label="Event Title"
            id="title"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            error={errors.title}
            placeholder="e.g. Saudi Vision 2030 Forum"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              placeholder="Brief description of the event..."
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Event Type"
              id="event_type_id"
              options={eventTypes.map(t => ({ value: String(t.id), label: t.name }))}
              placeholder="Select type..."
              value={form.event_type_id}
              onChange={(e) => update('event_type_id', e.target.value)}
            />
            <Select
              label="Client"
              id="client_id"
              options={clients.map(c => ({ value: String(c.id), label: c.name }))}
              placeholder="Select client..."
              value={form.client_id}
              onChange={(e) => update('client_id', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Status"
              id="status"
              options={EVENT_STATUSES.map(s => ({ value: s.value, label: s.label }))}
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
            />
            <Select
              label="Priority"
              id="priority"
              options={PRIORITIES.map(p => ({ value: p.value, label: p.label }))}
              value={form.priority}
              onChange={(e) => update('priority', e.target.value)}
            />
          </div>
        </section>

        {/* Dates */}
        <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Dates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              id="start_date"
              type="datetime-local"
              value={form.start_date}
              onChange={(e) => update('start_date', e.target.value)}
              error={errors.start_date}
            />
            <Input
              label="End Date"
              id="end_date"
              type="datetime-local"
              value={form.end_date}
              onChange={(e) => update('end_date', e.target.value)}
              error={errors.end_date}
            />
          </div>
        </section>

        {/* Venue */}
        <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Venue</h2>
          <Input
            label="Venue Name"
            id="venue_name"
            value={form.venue_name}
            onChange={(e) => update('venue_name', e.target.value)}
            placeholder="e.g. Riyadh International Convention Center"
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Address</label>
            <textarea
              value={form.venue_address}
              onChange={(e) => update('venue_address', e.target.value)}
              rows={2}
              placeholder="Full address..."
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              id="venue_city"
              value={form.venue_city}
              onChange={(e) => update('venue_city', e.target.value)}
              placeholder="Riyadh"
            />
            <Input
              label="Country"
              id="venue_country"
              value={form.venue_country}
              onChange={(e) => update('venue_country', e.target.value)}
              placeholder="Saudi Arabia"
            />
          </div>
        </section>

        {/* Budget & Capacity */}
        <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Budget & Capacity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Expected Attendees"
              id="expected_attendees"
              type="number"
              value={form.expected_attendees}
              onChange={(e) => update('expected_attendees', e.target.value)}
              placeholder="500"
            />
            <Input
              label="Estimated Budget (SAR)"
              id="budget_estimated"
              type="number"
              value={form.budget_estimated}
              onChange={(e) => update('budget_estimated', e.target.value)}
              placeholder="100000"
              hint="Enter amount in SAR"
            />
          </div>
        </section>

        {/* Notes */}
        <section className="bg-surface rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Notes</h2>
          <textarea
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            rows={3}
            placeholder="Internal notes about this event..."
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link href={isEdit ? `/events/${initialData!.id}` : '/events'}>
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" loading={loading}>
            <Save className="h-4 w-4" /> {isEdit ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </form>
    </>
  )
}
