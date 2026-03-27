import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { events } from '@/db/schema'
import { eq, and, gte, isNotNull } from 'drizzle-orm'

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeICalText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rows = await db
      .select()
      .from(events)
      .where(isNotNull(events.start_date))

    const activeEvents = rows.filter(e => e.status !== 'cancelled')

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TEEMS//Event Management//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:TEEMS Events',
      'X-WR-TIMEZONE:Asia/Riyadh',
    ]

    for (const event of activeEvents) {
      if (!event.start_date) continue

      const start = new Date(event.start_date)
      const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 3600000) // default 1hr

      lines.push('BEGIN:VEVENT')
      lines.push(`UID:event-${event.id}@teems.momentumworld.me`)
      lines.push(`DTSTART:${formatICalDate(start)}`)
      lines.push(`DTEND:${formatICalDate(end)}`)
      lines.push(`SUMMARY:${escapeICalText(event.title)}`)
      if (event.description) lines.push(`DESCRIPTION:${escapeICalText(event.description)}`)
      if (event.venue_name) {
        const loc = [event.venue_name, event.venue_city, event.venue_country].filter(Boolean).join(', ')
        lines.push(`LOCATION:${escapeICalText(loc)}`)
      }
      lines.push(`STATUS:${event.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'}`)
      if (event.created_at) lines.push(`CREATED:${formatICalDate(new Date(event.created_at))}`)
      lines.push('END:VEVENT')
    }

    lines.push('END:VCALENDAR')

    const ical = lines.join('\r\n')

    return new NextResponse(ical, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="teems-events.ics"',
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
