import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { events, speakers, exhibitors, event_speakers, event_exhibitors } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import {
  MapPin, CalendarDays, Building2, Wifi, Car, Phone,
  Shield, Clock, Users, Info,
} from 'lucide-react'

export default async function PortalEventInfoPage() {
  const session = await getSession()
  if (!session) return null

  // Get events for this external user
  let eventRows: {
    event_id: number
    event_title: string
    event_status: string
    event_start: Date
    event_end: Date
    venue_name: string | null
    venue_address: string | null
    venue_city: string | null
    venue_country: string | null
  }[] = []

  if (session.role_name === 'speaker') {
    const [speaker] = await db.select().from(speakers).where(eq(speakers.user_id, session.id)).limit(1)
    if (speaker) {
      eventRows = await db
        .select({
          event_id: events.id,
          event_title: events.title,
          event_status: events.status,
          event_start: events.start_date,
          event_end: events.end_date,
          venue_name: events.venue_name,
          venue_address: events.venue_address,
          venue_city: events.venue_city,
          venue_country: events.venue_country,
        })
        .from(event_speakers)
        .innerJoin(events, eq(event_speakers.event_id, events.id))
        .where(eq(event_speakers.speaker_id, speaker.id))
        .orderBy(asc(events.start_date))
    }
  } else if (session.role_name === 'exhibitor') {
    const [exhibitor] = await db.select().from(exhibitors).where(eq(exhibitors.user_id, session.id)).limit(1)
    if (exhibitor) {
      eventRows = await db
        .select({
          event_id: events.id,
          event_title: events.title,
          event_status: events.status,
          event_start: events.start_date,
          event_end: events.end_date,
          venue_name: events.venue_name,
          venue_address: events.venue_address,
          venue_city: events.venue_city,
          venue_country: events.venue_country,
        })
        .from(event_exhibitors)
        .innerJoin(events, eq(event_exhibitors.event_id, events.id))
        .where(eq(event_exhibitors.exhibitor_id, exhibitor.id))
        .orderBy(asc(events.start_date))
    }
  }

  if (eventRows.length === 0) {
    return (
      <>
        <PageHeader title="Event Information" description="Venue details, logistics, and important information" />
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <Info className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No event information available.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Event Information"
        description="Venue details, logistics, and important information for your events"
      />

      <div className="space-y-6">
        {eventRows.map(event => (
          <div key={event.event_id} className="bg-surface rounded-xl border border-border overflow-hidden">
            {/* Event header */}
            <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary-50/50 to-transparent">
              <h3 className="text-sm font-semibold text-text-primary">{event.event_title}</h3>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-xs text-text-secondary">
                  <CalendarDays className="h-3.5 w-3.5 text-text-tertiary" />
                  {formatDate(event.event_start)} — {formatDate(event.event_end)}
                </span>
                <Badge color={event.event_status === 'confirmed' ? 'green' : event.event_status === 'in_progress' ? 'blue' : 'gray'}>
                  {event.event_status}
                </Badge>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {/* Venue Information */}
              <div>
                <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary-500" />
                  Venue
                </h4>
                <div className="bg-surface-secondary rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {event.venue_name && (
                      <div>
                        <p className="text-text-tertiary mb-0.5">Name</p>
                        <p className="font-medium text-text-primary">{event.venue_name}</p>
                      </div>
                    )}
                    {event.venue_city && (
                      <div>
                        <p className="text-text-tertiary mb-0.5">Location</p>
                        <p className="font-medium text-text-primary">
                          {[event.venue_city, event.venue_country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                    {event.venue_address && (
                      <div className="sm:col-span-2">
                        <p className="text-text-tertiary mb-0.5">Address</p>
                        <p className="font-medium text-text-primary">{event.venue_address}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Practical Information */}
              <div>
                <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-primary-500" />
                  Practical Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoCard icon={Clock} title="Registration" text="Opens 1 hour before event start" />
                  <InfoCard icon={Car} title="Parking" text="Available at venue — details shared closer to event" />
                  <InfoCard icon={Wifi} title="WiFi" text="Will be shared via email before the event" />
                  <InfoCard icon={Phone} title="Contact" text="Reach your event coordinator via Messages" />
                  <InfoCard icon={Shield} title="Security" text="Photo ID required for entry" />
                  <InfoCard icon={Users} title="Dress Code" text="Business professional unless stated otherwise" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function InfoCard({ icon: Icon, title, text }: { icon: typeof Clock; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 bg-surface-secondary rounded-lg p-3">
      <Icon className="h-4 w-4 text-primary-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-medium text-text-primary">{title}</p>
        <p className="text-[11px] text-text-secondary mt-0.5">{text}</p>
      </div>
    </div>
  )
}
