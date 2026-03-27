import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { exhibitors, event_exhibitors, events, booths } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { PageHeader } from '@/components/layout/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { MapPin, CalendarDays, Ruler, Hash } from 'lucide-react'

export default async function PortalBoothPage() {
  const session = await getSession()
  if (!session) return null

  if (session.role_name !== 'exhibitor') {
    return (
      <>
        <PageHeader title="My Booth" description="This section is not available for your role" />
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-text-secondary">Booth information is only available for exhibitor accounts.</p>
        </div>
      </>
    )
  }

  const [exhibitor] = await db.select().from(exhibitors).where(eq(exhibitors.user_id, session.id)).limit(1)
  if (!exhibitor) {
    return (
      <>
        <PageHeader title="My Booth" />
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-text-secondary">No exhibitor profile linked to your account.</p>
        </div>
      </>
    )
  }

  const rows = await db
    .select({
      assignment_id: event_exhibitors.id,
      package_type: event_exhibitors.package_type,
      contract_amount: event_exhibitors.contract_amount,
      assignment_status: event_exhibitors.status,
      special_requirements: event_exhibitors.special_requirements,
      notes: event_exhibitors.notes,
      event_id: events.id,
      event_title: events.title,
      event_status: events.status,
      event_start: events.start_date,
      event_end: events.end_date,
      event_venue: events.venue_name,
      booth_id: booths.id,
      booth_number: booths.booth_number,
      booth_size: booths.size,
      booth_dimensions: booths.dimensions,
      booth_zone: booths.location_zone,
      booth_status: booths.status,
      booth_amenities: booths.amenities,
    })
    .from(event_exhibitors)
    .innerJoin(events, eq(event_exhibitors.event_id, events.id))
    .leftJoin(booths, eq(event_exhibitors.booth_id, booths.id))
    .where(eq(event_exhibitors.exhibitor_id, exhibitor.id))
    .orderBy(asc(events.start_date))

  return (
    <>
      <PageHeader
        title="My Booth"
        description="Your booth assignments across events"
      />

      {rows.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <MapPin className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">No booth assignments found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map(row => (
            <div key={row.assignment_id} className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{row.event_title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-1">
                    <CalendarDays className="h-3.5 w-3.5 text-text-tertiary" />
                    <span>{formatDate(row.event_start)} - {formatDate(row.event_end)}</span>
                  </div>
                  {row.event_venue && (
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-1">
                      <MapPin className="h-3.5 w-3.5 text-text-tertiary" />
                      <span>{row.event_venue}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge type="event" value={row.event_status} />
                  {row.assignment_status && (
                    <Badge color={
                      row.assignment_status === 'confirmed' ? 'green' :
                      row.assignment_status === 'pending' ? 'amber' :
                      row.assignment_status === 'cancelled' ? 'red' :
                      'gray'
                    }>
                      {row.assignment_status}
                    </Badge>
                  )}
                </div>
              </div>

              {row.booth_number ? (
                <div className="bg-surface-secondary rounded-lg border border-border p-4">
                  <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-3">Booth Details</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-text-tertiary mb-0.5">Booth Number</p>
                      <div className="flex items-center gap-1">
                        <Hash className="h-3.5 w-3.5 text-primary-500" />
                        <span className="font-semibold text-text-primary">{row.booth_number}</span>
                      </div>
                    </div>
                    {row.booth_zone && (
                      <div>
                        <p className="text-text-tertiary mb-0.5">Zone</p>
                        <p className="font-medium text-text-primary">{row.booth_zone}</p>
                      </div>
                    )}
                    {row.booth_dimensions && (
                      <div>
                        <p className="text-text-tertiary mb-0.5">Dimensions</p>
                        <div className="flex items-center gap-1">
                          <Ruler className="h-3.5 w-3.5 text-text-tertiary" />
                          <span className="font-medium text-text-primary">{row.booth_dimensions}</span>
                        </div>
                      </div>
                    )}
                    {row.booth_size && (
                      <div>
                        <p className="text-text-tertiary mb-0.5">Size</p>
                        <p className="font-medium text-text-primary">{row.booth_size}</p>
                      </div>
                    )}
                  </div>

                  {row.booth_status && (
                    <div className="mt-3">
                      <Badge color={
                        row.booth_status === 'assigned' || row.booth_status === 'occupied' ? 'green' :
                        row.booth_status === 'available' ? 'blue' :
                        'gray'
                      }>
                        {row.booth_status}
                      </Badge>
                    </div>
                  )}

                  {row.booth_amenities && (
                    <div className="mt-3">
                      <p className="text-text-tertiary text-xs mb-1">Amenities</p>
                      <p className="text-xs text-text-secondary">{row.booth_amenities}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-surface-secondary rounded-lg border border-border p-4 text-center">
                  <p className="text-xs text-text-tertiary">Booth not yet assigned</p>
                </div>
              )}

              {(row.package_type || row.special_requirements) && (
                <div className="mt-3 flex items-center gap-3 text-xs">
                  {row.package_type && <Badge color="purple">{row.package_type}</Badge>}
                  {row.special_requirements && (
                    <p className="text-text-tertiary">Requirements: {row.special_requirements}</p>
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
