import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { events, tasks, event_assignments, event_vendors } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { slugify } from '@/lib/utils'
import { logActivity } from '@/lib/activity'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const eventId = parseInt(id)
    if (isNaN(eventId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const body = await req.json()
    const { new_start_date } = body
    if (!new_start_date) {
      return NextResponse.json({ error: 'new_start_date is required' }, { status: 400 })
    }

    // Fetch original event
    const [original] = await db.select().from(events).where(eq(events.id, eventId)).limit(1)
    if (!original) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    // Calculate date offset
    const origStart = new Date(original.start_date)
    const newStart = new Date(new_start_date)
    const offsetMs = newStart.getTime() - origStart.getTime()

    const newEnd = original.end_date ? new Date(new Date(original.end_date).getTime() + offsetMs) : newStart

    // Generate unique slug
    const newTitle = `(Copy) ${original.title}`
    let slug = slugify(newTitle)
    const existing = await db.select({ id: events.id }).from(events).where(eq(events.slug, slug)).limit(1)
    if (existing.length > 0) slug = `${slug}-${Date.now()}`

    // Use transaction to ensure all cloned data is created atomically
    const newEvent = await db.transaction(async (tx) => {
      const [created] = await tx.insert(events).values({
        title: newTitle,
        slug,
        description: original.description,
        event_type_id: original.event_type_id,
        client_id: original.client_id,
        status: 'draft',
        priority: original.priority,
        start_date: newStart,
        end_date: newEnd,
        timezone: original.timezone,
        venue_name: original.venue_name,
        venue_address: original.venue_address,
        venue_city: original.venue_city,
        venue_country: original.venue_country,
        expected_attendees: original.expected_attendees,
        budget_estimated: original.budget_estimated,
        currency: original.currency,
        notes: original.notes,
        created_by: session.id,
        updated_by: session.id,
      }).returning()

      // Clone tasks (shift dates by offset)
      const originalTasks = await tx.select().from(tasks).where(eq(tasks.event_id, eventId))
      if (originalTasks.length > 0) {
        await tx.insert(tasks).values(
          originalTasks.map(t => ({
            event_id: created.id,
            title: t.title,
            description: t.description,
            status: 'todo' as const,
            priority: t.priority,
            due_date: t.due_date ? new Date(new Date(t.due_date).getTime() + offsetMs) : null,
            start_date: t.start_date ? new Date(new Date(t.start_date).getTime() + offsetMs) : null,
            estimated_hours: t.estimated_hours,
            sort_order: t.sort_order,
            created_by: session.id,
          }))
        )
      }

      // Clone team assignments
      const originalAssignments = await tx.select().from(event_assignments).where(eq(event_assignments.event_id, eventId))
      if (originalAssignments.length > 0) {
        await tx.insert(event_assignments).values(
          originalAssignments.map(a => ({
            event_id: created.id,
            user_id: a.user_id,
            role_in_event: a.role_in_event,
            assigned_by: session.id,
          }))
        )
      }

      // Clone vendor assignments
      const originalVendors = await tx.select().from(event_vendors).where(eq(event_vendors.event_id, eventId))
      if (originalVendors.length > 0) {
        await tx.insert(event_vendors).values(
          originalVendors.map(v => ({
            event_id: created.id,
            vendor_id: v.vendor_id,
            service_description: v.service_description,
            contract_amount: v.contract_amount,
            status: 'pending' as const,
            notes: v.notes,
          }))
        )
      }

      return created
    })

    logActivity({
      userId: session.id,
      action: 'created',
      resource: 'event',
      resourceId: newEvent.id,
      eventId: newEvent.id,
      details: JSON.stringify({ duplicated_from: eventId }),
    }).catch(() => {})

    return NextResponse.json({ data: newEvent }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
