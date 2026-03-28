import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { speakers, exhibitors, event_speakers, events } from '@/db/schema'
import { travel_arrangements } from '@/db/schema-extensions'
import { eq, and, asc } from 'drizzle-orm'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import {
  Plane, CalendarDays, Building2, Hotel, CheckCircle2,
  Clock, ShieldCheck, Car, CreditCard, FileText,
} from 'lucide-react'

type FlightInfo = {
  airline?: string
  flight_no?: string
  departure?: string
  arrival?: string
  date?: string
}

function parseFlightJson(raw: string | null): FlightInfo | null {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function statusColor(status: string | null): 'green' | 'amber' | 'red' | 'blue' | 'gray' {
  switch (status) {
    case 'confirmed': case 'booked': case 'approved': return 'green'
    case 'pending': case 'applied': return 'amber'
    case 'cancelled': case 'denied': return 'red'
    case 'not_required': return 'gray'
    default: return 'gray'
  }
}

export default async function PortalTravelPage() {
  const session = await getSession()
  if (!session) return null

  const isSpeaker = session.role_name === 'speaker'
  const isExhibitor = session.role_name === 'exhibitor'

  if (!isSpeaker && !isExhibitor) {
    return (
      <>
        <PageHeader title="Travel & Logistics" description="This section is not available for your role" />
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-text-secondary">Travel information is only available for speaker and exhibitor accounts.</p>
        </div>
      </>
    )
  }

  // Get event IDs the user is assigned to, plus venue info
  let eventRows: { event_id: number; event_title: string; event_start: Date | null; event_end: Date | null; venue_name: string | null; venue_city: string | null; venue_country: string | null; venue_address: string | null }[] = []

  if (isSpeaker) {
    const [speaker] = await db.select({ id: speakers.id }).from(speakers).where(eq(speakers.user_id, session.id)).limit(1)
    if (!speaker) {
      return (
        <>
          <PageHeader title="Travel & Logistics" />
          <div className="bg-surface rounded-xl border border-border p-12 text-center">
            <p className="text-sm text-text-secondary">No speaker profile linked to your account.</p>
          </div>
        </>
      )
    }
    eventRows = await db
      .select({
        event_id: events.id,
        event_title: events.title,
        event_start: events.start_date,
        event_end: events.end_date,
        venue_name: events.venue_name,
        venue_city: events.venue_city,
        venue_country: events.venue_country,
        venue_address: events.venue_address,
      })
      .from(event_speakers)
      .innerJoin(events, eq(event_speakers.event_id, events.id))
      .where(eq(event_speakers.speaker_id, speaker.id))
      .orderBy(asc(events.start_date))
  } else {
    const [exhibitor] = await db.select({ id: exhibitors.id }).from(exhibitors).where(eq(exhibitors.user_id, session.id)).limit(1)
    if (!exhibitor) {
      return (
        <>
          <PageHeader title="Travel & Logistics" />
          <div className="bg-surface rounded-xl border border-border p-12 text-center">
            <p className="text-sm text-text-secondary">No exhibitor profile linked to your account.</p>
          </div>
        </>
      )
    }
    // Exhibitors are linked via event_exhibitors — but travel_arrangements uses user_id directly,
    // so we just need the events where this user has travel arrangements
  }

  // Fetch travel arrangements for this user
  const travelRows = await db
    .select()
    .from(travel_arrangements)
    .where(eq(travel_arrangements.user_id, session.id))
    .orderBy(asc(travel_arrangements.created_at))

  // Build a map of event_id -> travel arrangement
  const travelByEvent = new Map<number, typeof travelRows>()
  for (const t of travelRows) {
    const list = travelByEvent.get(t.event_id) || []
    list.push(t)
    travelByEvent.set(t.event_id, list)
  }

  // For exhibitors, derive eventRows from travel arrangements if not already set
  if (isExhibitor && eventRows.length === 0) {
    const eventIds = [...new Set(travelRows.map(t => t.event_id))]
    if (eventIds.length > 0) {
      for (const eid of eventIds) {
        const [ev] = await db.select({
          event_id: events.id,
          event_title: events.title,
          event_start: events.start_date,
          event_end: events.end_date,
          venue_name: events.venue_name,
          venue_city: events.venue_city,
          venue_country: events.venue_country,
          venue_address: events.venue_address,
        }).from(events).where(eq(events.id, eid))
        if (ev) eventRows.push(ev)
      }
    }
  }

  // Merge: show events with or without travel info
  const allEventIds = new Set([...eventRows.map(e => e.event_id), ...travelByEvent.keys()])

  return (
    <>
      <PageHeader
        title="Travel & Logistics"
        description="Your travel arrangements, flights, hotels, and logistics"
      />

      {allEventIds.size === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <Plane className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No travel arrangements found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...allEventIds].map(eventId => {
            const event = eventRows.find(e => e.event_id === eventId)
            const arrangements = travelByEvent.get(eventId) || []

            return (
              <div key={eventId} className="bg-surface rounded-xl border border-border overflow-hidden">
                {/* Event header */}
                <div className="px-5 py-4 border-b border-border bg-surface-secondary/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">{event?.event_title || `Event #${eventId}`}</h3>
                      {event?.event_start && (
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-1">
                          <CalendarDays className="h-3.5 w-3.5 text-text-tertiary" />
                          <span>{formatDate(event.event_start)} - {formatDate(event.event_end)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  {/* Venue */}
                  {event?.venue_name && (
                    <div>
                      <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-primary-500" />
                        Venue
                      </h4>
                      <div className="bg-surface-secondary rounded-lg p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-text-tertiary mb-0.5">Venue</p>
                            <p className="font-medium text-text-primary">{event.venue_name}</p>
                          </div>
                          {event.venue_city && (
                            <div>
                              <p className="text-text-tertiary mb-0.5">City</p>
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
                  )}

                  {arrangements.length === 0 ? (
                    <div className="bg-surface-secondary rounded-lg p-4 text-center">
                      <p className="text-xs text-text-secondary">No travel arrangements have been set up for this event yet.</p>
                    </div>
                  ) : (
                    arrangements.map(travel => {
                      const arrivalFlight = parseFlightJson(travel.flight_arrival)
                      const departureFlight = parseFlightJson(travel.flight_departure)

                      return (
                        <div key={travel.id} className="space-y-4">
                          {/* Flights */}
                          {(arrivalFlight || departureFlight || travel.flight_booking_ref) && (
                            <div>
                              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Plane className="h-3.5 w-3.5 text-primary-500" />
                                Flights
                                {travel.flight_status && (
                                  <Badge color={statusColor(travel.flight_status)} className="ml-2">{travel.flight_status}</Badge>
                                )}
                              </h4>
                              <div className="bg-surface-secondary rounded-lg p-4 space-y-3">
                                {travel.flight_booking_ref && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <FileText className="h-3.5 w-3.5 text-text-tertiary" />
                                    <span className="text-text-tertiary">Booking Ref:</span>
                                    <span className="font-mono font-medium text-text-primary">{travel.flight_booking_ref}</span>
                                  </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {arrivalFlight && (
                                    <div className="border border-border rounded-lg p-3">
                                      <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold mb-2">Arrival</p>
                                      <div className="space-y-1 text-xs">
                                        {arrivalFlight.airline && <p><span className="text-text-tertiary">Airline:</span> <span className="font-medium text-text-primary">{arrivalFlight.airline}</span></p>}
                                        {arrivalFlight.flight_no && <p><span className="text-text-tertiary">Flight:</span> <span className="font-medium text-text-primary">{arrivalFlight.flight_no}</span></p>}
                                        {arrivalFlight.date && <p><span className="text-text-tertiary">Date:</span> <span className="font-medium text-text-primary">{arrivalFlight.date}</span></p>}
                                        {arrivalFlight.departure && <p><span className="text-text-tertiary">From:</span> <span className="font-medium text-text-primary">{arrivalFlight.departure}</span></p>}
                                        {arrivalFlight.arrival && <p><span className="text-text-tertiary">To:</span> <span className="font-medium text-text-primary">{arrivalFlight.arrival}</span></p>}
                                      </div>
                                    </div>
                                  )}
                                  {departureFlight && (
                                    <div className="border border-border rounded-lg p-3">
                                      <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold mb-2">Departure</p>
                                      <div className="space-y-1 text-xs">
                                        {departureFlight.airline && <p><span className="text-text-tertiary">Airline:</span> <span className="font-medium text-text-primary">{departureFlight.airline}</span></p>}
                                        {departureFlight.flight_no && <p><span className="text-text-tertiary">Flight:</span> <span className="font-medium text-text-primary">{departureFlight.flight_no}</span></p>}
                                        {departureFlight.date && <p><span className="text-text-tertiary">Date:</span> <span className="font-medium text-text-primary">{departureFlight.date}</span></p>}
                                        {departureFlight.departure && <p><span className="text-text-tertiary">From:</span> <span className="font-medium text-text-primary">{departureFlight.departure}</span></p>}
                                        {departureFlight.arrival && <p><span className="text-text-tertiary">To:</span> <span className="font-medium text-text-primary">{departureFlight.arrival}</span></p>}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Hotel */}
                          {(travel.hotel_name || travel.hotel_check_in) && (
                            <div>
                              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Hotel className="h-3.5 w-3.5 text-primary-500" />
                                Accommodation
                                {travel.hotel_status && (
                                  <Badge color={statusColor(travel.hotel_status)} className="ml-2">{travel.hotel_status}</Badge>
                                )}
                              </h4>
                              <div className="bg-surface-secondary rounded-lg p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                  {travel.hotel_name && (
                                    <div>
                                      <p className="text-text-tertiary mb-0.5">Hotel</p>
                                      <p className="font-medium text-text-primary">{travel.hotel_name}</p>
                                    </div>
                                  )}
                                  {travel.hotel_room_type && (
                                    <div>
                                      <p className="text-text-tertiary mb-0.5">Room Type</p>
                                      <p className="font-medium text-text-primary">{travel.hotel_room_type}</p>
                                    </div>
                                  )}
                                  {travel.hotel_check_in && (
                                    <div>
                                      <p className="text-text-tertiary mb-0.5">Check-in</p>
                                      <p className="font-medium text-text-primary">{formatDate(travel.hotel_check_in)}</p>
                                    </div>
                                  )}
                                  {travel.hotel_check_out && (
                                    <div>
                                      <p className="text-text-tertiary mb-0.5">Check-out</p>
                                      <p className="font-medium text-text-primary">{formatDate(travel.hotel_check_out)}</p>
                                    </div>
                                  )}
                                  {travel.hotel_confirmation && (
                                    <div className="sm:col-span-2">
                                      <p className="text-text-tertiary mb-0.5">Confirmation #</p>
                                      <p className="font-mono font-medium text-text-primary">{travel.hotel_confirmation}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Airport Transfer */}
                          {travel.airport_transfer && (
                            <div>
                              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Car className="h-3.5 w-3.5 text-primary-500" />
                                Airport Transfer
                              </h4>
                              <div className="bg-surface-secondary rounded-lg p-4">
                                <div className="flex items-center gap-2 text-xs">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                  <span className="text-text-primary font-medium">Airport transfer arranged</span>
                                </div>
                                {travel.transfer_details && (
                                  <p className="text-xs text-text-secondary mt-2 whitespace-pre-wrap">{travel.transfer_details}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Visa */}
                          {travel.visa_required && (
                            <div>
                              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5 text-primary-500" />
                                Visa
                                {travel.visa_status && (
                                  <Badge color={statusColor(travel.visa_status)} className="ml-2">{travel.visa_status}</Badge>
                                )}
                              </h4>
                              <div className="bg-surface-secondary rounded-lg p-4 text-xs">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3.5 w-3.5 text-text-tertiary" />
                                  <span className="text-text-tertiary">Status:</span>
                                  <span className="font-medium text-text-primary capitalize">{travel.visa_status?.replace('_', ' ')}</span>
                                </div>
                                {travel.visa_number && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <FileText className="h-3.5 w-3.5 text-text-tertiary" />
                                    <span className="text-text-tertiary">Visa #:</span>
                                    <span className="font-mono font-medium text-text-primary">{travel.visa_number}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Per Diem */}
                          {(travel.per_diem_rate || travel.total_cost) && (
                            <div>
                              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <CreditCard className="h-3.5 w-3.5 text-primary-500" />
                                Per Diem & Costs
                              </h4>
                              <div className="bg-surface-secondary rounded-lg p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                  {travel.per_diem_rate != null && (
                                    <div>
                                      <p className="text-text-tertiary mb-0.5">Daily Rate</p>
                                      <p className="font-medium text-text-primary">{(travel.per_diem_rate / 100).toFixed(2)} SAR</p>
                                    </div>
                                  )}
                                  {travel.per_diem_days != null && (
                                    <div>
                                      <p className="text-text-tertiary mb-0.5">Days</p>
                                      <p className="font-medium text-text-primary">{travel.per_diem_days}</p>
                                    </div>
                                  )}
                                  {travel.total_cost != null && (
                                    <div>
                                      <p className="text-text-tertiary mb-0.5">Total Cost</p>
                                      <p className="font-semibold text-text-primary">{(travel.total_cost / 100).toFixed(2)} SAR</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {travel.notes && (
                            <div>
                              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">Additional Notes</h4>
                              <p className="text-sm text-text-secondary whitespace-pre-wrap">{travel.notes}</p>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
