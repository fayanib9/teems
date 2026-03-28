'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/layout/page-header'
import { Select } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import { BookOpen, Search } from 'lucide-react'
import Link from 'next/link'

type Lesson = {
  id: number
  event_id: number
  category: string
  title: string
  description: string
  impact: string | null
  recommendation: string | null
  created_by: number | null
  created_at: Date | null
  author_first_name: string | null
  author_last_name: string | null
  event_title: string | null
}

type Props = {
  lessons: Lesson[]
  events: { id: number; title: string }[]
}

const categories = [
  { value: 'planning', label: 'Planning' },
  { value: 'execution', label: 'Execution' },
  { value: 'vendor_management', label: 'Vendor Management' },
  { value: 'communication', label: 'Communication' },
  { value: 'budget', label: 'Budget' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'technology', label: 'Technology' },
  { value: 'stakeholder', label: 'Stakeholder Management' },
  { value: 'other', label: 'Other' },
]

const impactColors: Record<string, 'green' | 'red' | 'gray'> = {
  positive: 'green',
  negative: 'red',
  neutral: 'gray',
}

export function LessonsRepoClient({ lessons, events }: Props) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [impactFilter, setImpactFilter] = useState('')

  const filtered = lessons.filter(l => {
    const matchSearch = !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || l.category === categoryFilter
    const matchEvent = !eventFilter || l.event_id === parseInt(eventFilter)
    const matchImpact = !impactFilter || l.impact === impactFilter
    return matchSearch && matchCategory && matchEvent && matchImpact
  })

  return (
    <>
      <PageHeader
        title="Lessons Learned Repository"
        description="Cross-event knowledge base for continuous improvement"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search lessons..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="w-44">
          <Select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            options={categories}
            placeholder="All categories"
          />
        </div>
        <div className="w-44">
          <Select
            value={eventFilter}
            onChange={e => setEventFilter(e.target.value)}
            options={events.map(e => ({ value: String(e.id), label: e.title }))}
            placeholder="All events"
          />
        </div>
        <div className="w-36">
          <Select
            value={impactFilter}
            onChange={e => setImpactFilter(e.target.value)}
            options={[
              { value: 'positive', label: 'Positive' },
              { value: 'negative', label: 'Negative' },
              { value: 'neutral', label: 'Neutral' },
            ]}
            placeholder="All impacts"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No lessons found"
          description="No lessons match your current filters. Lessons are added from individual event pages."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(lesson => (
            <div key={lesson.id} className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-start gap-2 mb-1">
                <h3 className="font-medium text-text-primary">{lesson.title}</h3>
                <Badge color="purple">{lesson.category.replace(/_/g, ' ')}</Badge>
                {lesson.impact && (
                  <Badge color={impactColors[lesson.impact] || 'gray'}>
                    {lesson.impact}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-text-secondary">{lesson.description}</p>
              {lesson.recommendation && (
                <div className="mt-2 p-2 bg-surface-secondary rounded-md">
                  <p className="text-xs font-medium text-text-secondary mb-0.5">Recommendation</p>
                  <p className="text-sm text-text-primary">{lesson.recommendation}</p>
                </div>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
                {lesson.event_title && (
                  <Link
                    href={`/events/${lesson.event_id}/lessons`}
                    className="text-primary-600 hover:underline"
                  >
                    {lesson.event_title}
                  </Link>
                )}
                <span>by {lesson.author_first_name} {lesson.author_last_name}</span>
                <span>{formatDate(lesson.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
