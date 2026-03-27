import { getSession } from '@/lib/auth'
import { db } from '@/db'
import {
  events, clients, vendors, speakers, exhibitors,
  event_vendors, event_speakers, event_exhibitors,
} from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate } from '@/lib/utils'
import { CalendarDays, MapPin } from 'lucide-react'

export default async function PortalEventsPage() {
  const session = await getSession()
  if (!session) return null

  const role = session.role_name
  let eventList: EventRow[] = []

  if (role === 'client') {
    const [client] = await db.select().from(clients).where(eq(clients.user_id, session.id)).limit(1)
    if (client) {
      eventList = await db
        .select({
          id: events.id,
          title: events.title,
          status: events.status,
          priority: events.priority,
          start_date: events.start_date,
          end_date: events.end_date,
          venue_name: events.venue_name,
          venue_city: events.venue_city,
          expected_attendees: events.expected_attendees,
        })
        .from(events)
        .where(eq(events.client_id, client.id))
        .orderBy(events.start_date)
    }
  } else if (role === 'vendor') {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.user_id, session.id)).limit(1)
    if (vendor) {
      eventList = await db
        .select({
          id: events.id,
          title: events.title,
          status: events.status,
          priority: events.priority,
          start_date: events.start_date,
          end_date: events.end_date,
          venue_name: events.venue_name,
          venue_city: events.venue_city,
          expected_attendees: events.expected_attendees,
        })
        .from(event_vendors)
        .innerJoin(events, eq(event_vendors.event_id, events.id))
        .where(eq(event_vendors.vendor_id, vendor.id))
        .orderBy(events.start_date)
    }
  } else if (role === 'speaker') {
    const [speaker] = await db.select().from(speakers).where(eq(speakers.user_id, session.id)).limit(1)
    if (speaker) {
      eventList = await db
        .select({
          id: events.id,
          title: events.title,
          status: events.status,
          priority: events.priority,
          start_date: events.start_date,
          end_date: events.end_date,
          venue_name: events.venue_name,
          venue_city: events.venue_city,
          expected_attendees: events.expected_attendees,
        })
        .from(event_speakers)
        .innerJoin(events, eq(event_speakers.event_id, events.id))
        .where(eq(event_speakers.speaker_id, speaker.id))
        .orderBy(events.start_date)
    }
  } else if (role === 'exhibitor') {
    const [exhibitor] = await db.select().from(exhibitors).where(eq(exhibitors.user_id, session.id)).limit(1)
    if (exhibitor) {
      eventList = await db
        .select({
          id: events.id,
          title: events.title,
          status: events.status,
          priority: events.priority,
          start_date: events.start_date,
          end_date: events.end_date,
          venue_name: events.venue_name,
          venue_city: events.venue_city,
          expected_attendees: events.expected_attendees,
        })
        .from(event_exhibitors)
        .innerJoin(events, eq(event_exhibitors.event_id, events.id))
        .where(eq(event_exhibitors.exhibitor_id, exhibitor.id))
        .orderBy(events.start_date)
    }
  }

  return (
    <>
      <PageHeader
        title="My Events"
        description={`Events associated with your ${role} account`}
      />

      {eventList.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <CalendarDays className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No events found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {eventList.map(event => (
            <div
              key={event.id}
              className="bg-surface rounded-xl border border-border p-5 hover:border-primary-200 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary leading-snug">{event.title}</h3>
                <StatusBadge type="event" value={event.status} />
              </div>

              <div className="space-y-2 text-xs text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-text-tertiary" />
                  <span>{formatDate(event.start_date)} - {formatDate(event.end_date)}</span>
                </div>
                {(event.venue_name || event.venue_city) && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-text-tertiary" />
                    <span>{[event.venue_name, event.venue_city].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {event.expected_attendees && (
                  <p className="text-text-tertiary">{event.expected_attendees.toLocaleString()} expected attendees</p>
                )}
              </div>

              {event.priority && (
                <div className="mt-3">
                  <StatusBadge type="priority" value={event.priority} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

type EventRow = {
  id: number
  title: string
  status: string
  priority: string | null
  start_date: Date
  end_date: Date
  venue_name: string | null
  venue_city: string | null
  expected_attendees: number | null
}
