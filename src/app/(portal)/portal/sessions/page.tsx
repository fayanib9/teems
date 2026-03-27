import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { speakers, event_speakers, events, sessions } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Mic, CalendarDays, Clock, MapPin } from 'lucide-react'

export default async function PortalSessionsPage() {
  const session = await getSession()
  if (!session) return null

  if (session.role_name !== 'speaker') {
    return (
      <>
        <PageHeader title="My Sessions" description="This section is not available for your role" />
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-text-secondary">Sessions are only available for speaker accounts.</p>
        </div>
      </>
    )
  }

  const [speaker] = await db.select().from(speakers).where(eq(speakers.user_id, session.id)).limit(1)
  if (!speaker) {
    return (
      <>
        <PageHeader title="My Sessions" />
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-text-secondary">No speaker profile linked to your account.</p>
        </div>
      </>
    )
  }

  const rows = await db
    .select({
      assignment_id: event_speakers.id,
      role: event_speakers.role,
      status: event_speakers.status,
      fee: event_speakers.fee,
      event_id: events.id,
      event_title: events.title,
      event_status: events.status,
      event_start: events.start_date,
      event_venue: events.venue_name,
      session_id: sessions.id,
      session_title: sessions.title,
      session_type: sessions.session_type,
      session_date: sessions.date,
      session_start_time: sessions.start_time,
      session_end_time: sessions.end_time,
      session_location: sessions.location,
      session_status: sessions.status,
    })
    .from(event_speakers)
    .innerJoin(events, eq(event_speakers.event_id, events.id))
    .leftJoin(sessions, eq(event_speakers.session_id, sessions.id))
    .where(eq(event_speakers.speaker_id, speaker.id))
    .orderBy(asc(sessions.date), asc(sessions.start_time))

  return (
    <>
      <PageHeader
        title="My Sessions"
        description="Your speaking sessions across events"
      />

      {rows.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <Mic className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No session assignments found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map(row => (
            <div key={row.assignment_id} className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    {row.session_title || 'No session assigned'}
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">{row.event_title}</p>
                </div>
                <div className="flex items-center gap-2">
                  {row.session_status && <StatusBadge type="event" value={row.session_status} />}
                  {row.status && (
                    <Badge color={
                      row.status === 'confirmed' ? 'green' :
                      row.status === 'invited' ? 'blue' :
                      row.status === 'declined' ? 'red' :
                      'gray'
                    }>
                      {row.status}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-text-secondary">
                {row.session_date && (
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-text-tertiary" />
                    <span>{formatDate(row.session_date)}</span>
                  </div>
                )}
                {row.session_start_time && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-text-tertiary" />
                    <span>{row.session_start_time} - {row.session_end_time}</span>
                  </div>
                )}
                {row.session_location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-text-tertiary" />
                    <span>{row.session_location}</span>
                  </div>
                )}
              </div>

              {row.session_type && (
                <div className="mt-3">
                  <Badge color="purple">{row.session_type}</Badge>
                  {row.role && row.role !== 'speaker' && (
                    <Badge color="gray" className="ml-2">{row.role}</Badge>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
