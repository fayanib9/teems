'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { useToast } from '@/components/ui/toast'
import { formatDate } from '@/lib/utils'
import { Plus, BookOpen, ArrowLeft, ThumbsUp, ThumbsDown, Minus } from 'lucide-react'
import Link from 'next/link'

type Lesson = {
  id: number
  category: string
  title: string
  description: string
  impact: string | null
  recommendation: string | null
  created_by: number | null
  created_at: Date | null
  author_first_name: string | null
  author_last_name: string | null
}

type Props = {
  eventId: number
  eventTitle: string
  lessons: Lesson[]
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

const impacts = [
  { value: 'positive', label: 'Positive' },
  { value: 'negative', label: 'Negative' },
  { value: 'neutral', label: 'Neutral' },
]

const impactColors: Record<string, 'green' | 'red' | 'gray'> = {
  positive: 'green',
  negative: 'red',
  neutral: 'gray',
}

export function LessonsClient({ eventId, eventTitle, lessons: initialLessons }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [lessons] = useState(initialLessons)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    impact: '',
    recommendation: '',
  })

  const filtered = categoryFilter
    ? lessons.filter(l => l.category === categoryFilter)
    : lessons

  async function handleCreate() {
    if (!form.category || !form.title || !form.description) {
      toast({ type: 'error', message: 'Category, title, and description are required' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast({ type: 'success', message: 'Lesson recorded' })
      setShowForm(false)
      setForm({ category: '', title: '', description: '', impact: '', recommendation: '' })
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to add lesson' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-1">
        <Link href={`/events/${eventId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <p className="text-xs text-text-tertiary">{eventTitle}</p>
          <h1 className="text-xl font-semibold text-text-primary">Lessons Learned</h1>
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Lesson
          </Button>
        </div>
      </div>

      <p className="text-sm text-text-secondary mb-4 ml-12">Capture insights and recommendations for future events</p>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1 mb-4">
        <button
          onClick={() => setCategoryFilter('')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            !categoryFilter ? 'bg-primary-50 text-primary-700' : 'bg-surface-tertiary text-text-secondary hover:text-text-primary'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              categoryFilter === cat.value ? 'bg-primary-50 text-primary-700' : 'bg-surface-tertiary text-text-secondary hover:text-text-primary'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No lessons recorded"
          description="Start capturing lessons learned from this event."
          action={{ label: 'Add Lesson', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(lesson => (
            <div key={lesson.id} className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
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
                    <span>by {lesson.author_first_name} {lesson.author_last_name}</span>
                    <span>{formatDate(lesson.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Lesson Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Lesson Learned" size="lg">
        <div className="space-y-4">
          <Select
            label="Category"
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            options={categories}
            placeholder="Select category..."
          />
          <Input
            label="Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Brief summary of the lesson"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Detailed description of what happened..."
          />
          <Select
            label="Impact"
            value={form.impact}
            onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
            options={impacts}
            placeholder="Select impact..."
          />
          <Textarea
            label="Recommendation"
            value={form.recommendation}
            onChange={e => setForm(f => ({ ...f, recommendation: e.target.value }))}
            placeholder="What should be done differently in the future?"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleCreate}>Save Lesson</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
