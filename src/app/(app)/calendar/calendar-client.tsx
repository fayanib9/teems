'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, CalendarDays, Download } from 'lucide-react'
import Link from 'next/link'

type CalEvent = {
  id: number
  title: string
  status: string
  start_date: Date | null
  end_date: Date | null
  event_type_color: string | null
}

type Props = {
  events: CalEvent[]
  year: number
  month: number
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarClient({ events, year, month }: Props) {
  const router = useRouter()

  function navigate(dir: -1 | 1) {
    let newMonth = month + dir
    let newYear = year
    if (newMonth < 1) { newMonth = 12; newYear-- }
    if (newMonth > 12) { newMonth = 1; newYear++ }
    router.push(`/calendar?year=${newYear}&month=${newMonth}`)
  }

  function goToday() {
    const now = new Date()
    router.push(`/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
  }

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startOffset = firstDay.getDay()
  const totalDays = lastDay.getDate()
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month

  const days: { date: Date; isCurrentMonth: boolean }[] = []

  // Previous month overflow
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, -i)
    days.push({ date: d, isCurrentMonth: false })
  }

  // Current month
  for (let i = 1; i <= totalDays; i++) {
    days.push({ date: new Date(year, month - 1, i), isCurrentMonth: true })
  }

  // Next month overflow
  const remaining = 42 - days.length // 6 rows * 7 cols
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: false })
  }

  function getEventsForDate(date: Date): CalEvent[] {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(e => {
      if (!e.start_date || !e.end_date) return false
      const start = new Date(e.start_date).toISOString().split('T')[0]
      const end = new Date(e.end_date).toISOString().split('T')[0]
      return dateStr >= start && dateStr <= end
    })
  }

  function isToday(date: Date): boolean {
    return date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
  }

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Event schedule overview"
        actions={
          <a href="/api/calendar/export" download>
            <Button variant="outline"><Download className="h-4 w-4" /> Export iCal</Button>
          </a>
        }
      />

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-semibold text-text-primary min-w-[160px] text-center">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAY_NAMES.map(day => (
            <div key={day} className="px-2 py-2 text-center text-xs font-medium text-text-tertiary uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayEvents = getEventsForDate(day.date)
            const todayClass = isToday(day.date)

            return (
              <div
                key={i}
                className={`min-h-[80px] sm:min-h-[100px] border-b border-r border-border p-1.5 ${
                  !day.isCurrentMonth ? 'bg-gray-50' : ''
                }`}
              >
                <div className={`text-xs font-medium mb-1 ${
                  todayClass
                    ? 'bg-primary-500 text-white w-6 h-6 rounded-full flex items-center justify-center'
                    : day.isCurrentMonth ? 'text-text-primary' : 'text-text-tertiary'
                }`}>
                  {day.date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(e => (
                    <Link
                      key={e.id}
                      href={`/events/${e.id}`}
                      className="block text-xs px-1.5 py-0.5 rounded truncate hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: `${e.event_type_color || '#312C6A'}20`,
                        color: e.event_type_color || '#312C6A',
                      }}
                    >
                      {e.title}
                    </Link>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-xs text-text-tertiary px-1">+{dayEvents.length - 3} more</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
