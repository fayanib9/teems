'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import {
  Star, Send, ThumbsUp, Meh, ThumbsDown,
  CheckCircle2, MessageSquare, CalendarDays,
} from 'lucide-react'

type EventOption = {
  id: number
  title: string
  start_date: string
  end_date: string
}

const RATING_CATEGORIES = [
  { key: 'venue', label: 'Venue & Facilities' },
  { key: 'organization', label: 'Organization & Logistics' },
  { key: 'communication', label: 'Communication' },
  { key: 'overall', label: 'Overall Experience' },
] as const

function getNpsLabel(score: number): { text: string; color: string } {
  if (score >= 9) return { text: 'Promoter', color: 'text-green-600' }
  if (score >= 7) return { text: 'Passive', color: 'text-yellow-600' }
  return { text: 'Detractor', color: 'text-red-600' }
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-colors cursor-pointer"
        >
          <Star
            className={`h-6 w-6 ${
              star <= (hover || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default function PortalFeedbackPage() {
  const [events, setEvents] = useState<EventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [comments, setComments] = useState('')
  const [suggestions, setSuggestions] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [loadingEvents, setLoadingEvents] = useState(true)

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/portal/events')
      if (res.ok) {
        const json = await res.json()
        setEvents(json.data || [])
      }
    } catch {
      // silent
    } finally {
      setLoadingEvents(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedEventId) {
      setError('Please select an event')
      return
    }

    const overallRating = ratings['overall'] || null
    if (!overallRating) {
      setError('Please provide an overall rating')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/events/${selectedEventId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nps_score: npsScore,
          overall_rating: overallRating,
          ratings,
          comments: comments || null,
          suggestions: suggestions || null,
          would_recommend: wouldRecommend,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit feedback')
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedEventId('')
    setRatings({})
    setNpsScore(null)
    setComments('')
    setSuggestions('')
    setWouldRecommend(null)
    setSubmitted(false)
    setError('')
  }

  if (submitted) {
    return (
      <>
        <PageHeader title="Post-Event Feedback" />
        <div className="bg-surface rounded-xl border border-border p-12 text-center max-w-lg mx-auto">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">Thank you!</h2>
          <p className="text-sm text-text-secondary mb-6">
            Your feedback has been submitted successfully. It helps us improve future events.
          </p>
          <Button variant="outline" onClick={resetForm}>
            Submit Another Response
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Post-Event Feedback"
        description="Share your experience to help us improve future events"
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Event Selection */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Select Event</h3>
          </div>
          {loadingEvents ? (
            <div className="h-9 bg-surface-secondary rounded-md animate-pulse" />
          ) : (
            <Select
              id="event"
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
              placeholder="Choose an event..."
              options={events.map(ev => ({
                value: String(ev.id),
                label: ev.title,
              }))}
            />
          )}
        </div>

        {/* Star Ratings */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Ratings</h3>
          </div>
          <div className="space-y-4">
            {RATING_CATEGORIES.map(cat => (
              <div key={cat.key} className="flex items-center justify-between">
                <label className="text-sm text-text-secondary">{cat.label}</label>
                <StarRating
                  value={ratings[cat.key] || 0}
                  onChange={v => setRatings(prev => ({ ...prev, [cat.key]: v }))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* NPS Score */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Net Promoter Score</h3>
          </div>
          <p className="text-xs text-text-tertiary mb-4">
            How likely are you to recommend our events to a colleague? (0 = Not at all, 10 = Extremely likely)
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {Array.from({ length: 11 }, (_, i) => i).map(score => {
              const isSelected = npsScore === score
              let bgClass = 'bg-surface-secondary hover:bg-surface-tertiary'
              if (isSelected) {
                if (score >= 9) bgClass = 'bg-green-500 text-white'
                else if (score >= 7) bgClass = 'bg-yellow-500 text-white'
                else bgClass = 'bg-red-500 text-white'
              }
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => setNpsScore(score)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer ${bgClass}`}
                >
                  {score}
                </button>
              )
            })}
          </div>
          {npsScore !== null && (
            <div className="mt-3 flex items-center gap-2">
              {npsScore >= 9 ? (
                <ThumbsUp className="h-4 w-4 text-green-600" />
              ) : npsScore >= 7 ? (
                <Meh className="h-4 w-4 text-yellow-600" />
              ) : (
                <ThumbsDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-xs font-medium ${getNpsLabel(npsScore).color}`}>
                {getNpsLabel(npsScore).text}
              </span>
            </div>
          )}
        </div>

        {/* Would Recommend */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Would you recommend this event to others?
          </h3>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setWouldRecommend(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                wouldRecommend === true
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
              Yes
            </button>
            <button
              type="button"
              onClick={() => setWouldRecommend(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                wouldRecommend === false
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              <ThumbsDown className="h-4 w-4" />
              No
            </button>
          </div>
        </div>

        {/* Comments & Suggestions */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-4 w-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-text-primary">Comments & Suggestions</h3>
          </div>
          <div className="space-y-4">
            <Textarea
              id="comments"
              label="Comments"
              placeholder="What did you enjoy? What went well?"
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={3}
            />
            <Textarea
              id="suggestions"
              label="Suggestions for Improvement"
              placeholder="What could we do better next time?"
              value={suggestions}
              onChange={e => setSuggestions(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" loading={submitting}>
            <Send className="h-4 w-4" />
            Submit Feedback
          </Button>
        </div>
      </form>
    </>
  )
}
