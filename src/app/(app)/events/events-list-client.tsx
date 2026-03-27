'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { EVENT_STATUSES } from '@/lib/constants'
import { Plus, Search, CalendarDays, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

type Event = {
  id: number
  title: string
  slug: string
  status: string
  priority: string | null
  start_date: Date | null
  end_date: Date | null
  venue_name: string | null
  venue_city: string | null
  expected_attendees: number | null
  budget_estimated: number | null
  created_at: Date | null
  event_type_name: string | null
  event_type_color: string | null
  event_type_icon: string | null
  client_name: string | null
}

type Props = {
  events: Event[]
  eventTypes: { id: number; name: string; color: string | null }[]
  pagination: { page: number; limit: number; total: number; pages: number }
  filters: { status?: string; search?: string; type_id?: string; sort?: string; order?: string }
  canCreate: boolean
}

export function EventsListClient({ events, eventTypes, pagination, filters, canCreate }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState(filters.search || '')

  function updateFilters(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const merged = { ...filters, ...updates }
    for (const [key, value] of Object.entries(merged)) {
      if (value && value !== '' && key !== 'sort' && key !== 'order') {
        params.set(key, value)
      }
    }
    // Reset page when filters change
    if (updates.status !== undefined || updates.search !== undefined || updates.type_id !== undefined) {
      params.delete('page')
    }
    router.push(`/events?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateFilters({ search: search || undefined })
  }

  return (
    <>
      <PageHeader
        title="Events"
        description={`${pagination.total} event${pagination.total !== 1 ? 's' : ''}`}
        actions={
          canCreate ? (
            <Link href="/events/new">
              <Button><Plus className="h-4 w-4" /> New Event</Button>
            </Link>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </form>
        <Select
          options={EVENT_STATUSES.map(s => ({ value: s.value, label: s.label }))}
          placeholder="All statuses"
          value={filters.status || ''}
          onChange={(e) => updateFilters({ status: e.target.value || undefined })}
          className="w-40"
        />
        <Select
          options={eventTypes.map(t => ({ value: String(t.id), label: t.name }))}
          placeholder="All types"
          value={filters.type_id || ''}
          onChange={(e) => updateFilters({ type_id: e.target.value || undefined })}
          className="w-40"
        />
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events found"
          description={filters.search || filters.status ? 'Try adjusting your filters' : 'Create your first event to get started'}
          action={canCreate ? { label: 'New Event', onClick: () => router.push('/events/new') } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="block bg-surface rounded-xl border border-border hover:border-primary-200 hover:shadow-sm transition-all p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {event.event_type_name && (
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${event.event_type_color}15`,
                          color: event.event_type_color || '#7C3AED',
                        }}
                      >
                        {event.event_type_name}
                      </span>
                    )}
                    {event.client_name && (
                      <span className="text-xs text-text-tertiary">
                        {event.client_name}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-text-primary truncate">{event.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-text-secondary">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(event.start_date)}
                      {event.end_date && event.start_date?.toString() !== event.end_date?.toString() && (
                        <> — {formatDate(event.end_date)}</>
                      )}
                    </span>
                    {event.venue_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.venue_name}{event.venue_city ? `, ${event.venue_city}` : ''}
                      </span>
                    )}
                    {event.expected_attendees && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {event.expected_attendees.toLocaleString()}
                      </span>
                    )}
                    {event.budget_estimated && (
                      <span className="text-text-tertiary">
                        {formatCurrency(event.budget_estimated)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge type="event" value={event.status} />
                  {event.priority && event.priority !== 'medium' && (
                    <StatusBadge type="priority" value={event.priority} />
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <p className="text-sm text-text-secondary">
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => updateFilters({ page: String(pagination.page - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-text-secondary px-2">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() => updateFilters({ page: String(pagination.page + 1) })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
