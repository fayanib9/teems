import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { events, tasks, sessions, event_vendors, event_checklist_items } from '@/db/schema'
import { event_templates } from '@/db/schema-extensions'
import { eq, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const eventTypeId = searchParams.get('event_type_id')

    const conditions = [eq(event_templates.is_active, true)]
    if (eventTypeId) {
      conditions.push(eq(event_templates.event_type_id, parseInt(eventTypeId)))
    }

    const templates = await db
      .select()
      .from(event_templates)
      .where(and(...conditions))
      .orderBy(event_templates.created_at)

    return NextResponse.json({ data: templates })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, event_id } = body

    if (!name || !event_id) {
      return NextResponse.json({ error: 'name and event_id are required' }, { status: 400 })
    }

    const eventId = parseInt(event_id)
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event_id' }, { status: 400 })
    }

    // Fetch source event
    const [sourceEvent] = await db.select().from(events).where(eq(events.id, eventId)).limit(1)
    if (!sourceEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Fetch related data
    const [eventTasks, eventSessions, eventVendors, eventChecklist] = await Promise.all([
      db.select().from(tasks).where(eq(tasks.event_id, eventId)),
      db.select().from(sessions).where(eq(sessions.event_id, eventId)),
      db.select().from(event_vendors).where(eq(event_vendors.event_id, eventId)),
      db.select().from(event_checklist_items).where(eq(event_checklist_items.event_id, eventId)),
    ])

    // Calculate days offset from event start for task dates
    const eventStart = new Date(sourceEvent.start_date).getTime()

    // Serialize template data — strip IDs, dates, user-specific data
    const templateData = {
      event: {
        description: sourceEvent.description,
        venue_name: sourceEvent.venue_name,
        venue_address: sourceEvent.venue_address,
        venue_city: sourceEvent.venue_city,
        venue_country: sourceEvent.venue_country,
        expected_attendees: sourceEvent.expected_attendees,
        budget_estimated: sourceEvent.budget_estimated,
        currency: sourceEvent.currency,
        timezone: sourceEvent.timezone,
        priority: sourceEvent.priority,
        notes: sourceEvent.notes,
      },
      tasks: eventTasks.map(t => ({
        title: t.title,
        description: t.description,
        priority: t.priority,
        estimated_hours: t.estimated_hours,
        sort_order: t.sort_order,
        // Store relative day offsets from event start
        due_date_offset: t.due_date ? Math.round((new Date(t.due_date).getTime() - eventStart) / (1000 * 60 * 60 * 24)) : null,
        start_date_offset: t.start_date ? Math.round((new Date(t.start_date).getTime() - eventStart) / (1000 * 60 * 60 * 24)) : null,
      })),
      sessions: eventSessions.map(s => ({
        title: s.title,
        description: s.description,
        session_type: s.session_type,
        start_time: s.start_time,
        end_time: s.end_time,
        location: s.location,
        capacity: s.capacity,
        sort_order: s.sort_order,
        // Store day offset from event start
        date_offset: Math.round((new Date(s.date).getTime() - eventStart) / (1000 * 60 * 60 * 24)),
      })),
      vendors: eventVendors.map(v => ({
        vendor_id: v.vendor_id,
        service_description: v.service_description,
        contract_amount: v.contract_amount,
        notes: v.notes,
      })),
      checklist_items: eventChecklist.map(c => ({
        stage: c.stage,
        item_name: c.item_name,
        is_required: c.is_required,
        sort_order: c.sort_order,
      })),
    }

    const [template] = await db.insert(event_templates).values({
      name,
      description: description || null,
      event_type_id: sourceEvent.event_type_id,
      source_event_id: eventId,
      template_data: JSON.stringify(templateData),
      created_by: session.id,
    }).returning()

    return NextResponse.json({ data: template }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
