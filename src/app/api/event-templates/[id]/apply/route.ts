import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { events, tasks, sessions, event_vendors, event_checklist_items } from '@/db/schema'
import { event_templates } from '@/db/schema-extensions'
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
    const templateId = parseInt(id)
    if (isNaN(templateId)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 })
    }

    const body = await req.json()
    const { title, start_date, end_date, client_id } = body

    if (!title || !start_date || !end_date) {
      return NextResponse.json({ error: 'title, start_date, and end_date are required' }, { status: 400 })
    }

    // Load template
    const [template] = await db.select().from(event_templates).where(eq(event_templates.id, templateId)).limit(1)
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    if (!template.is_active) {
      return NextResponse.json({ error: 'Template is inactive' }, { status: 400 })
    }

    // Parse template data
    const templateData = JSON.parse(template.template_data) as {
      event: {
        description: string | null
        venue_name: string | null
        venue_address: string | null
        venue_city: string | null
        venue_country: string | null
        expected_attendees: number | null
        budget_estimated: number | null
        currency: string | null
        timezone: string | null
        priority: string | null
        notes: string | null
      }
      tasks: Array<{
        title: string
        description: string | null
        priority: string | null
        estimated_hours: number | null
        sort_order: number | null
        due_date_offset: number | null
        start_date_offset: number | null
      }>
      sessions: Array<{
        title: string
        description: string | null
        session_type: string | null
        start_time: string
        end_time: string
        location: string | null
        capacity: number | null
        sort_order: number | null
        date_offset: number
      }>
      vendors: Array<{
        vendor_id: number
        service_description: string | null
        contract_amount: number | null
        notes: string | null
      }>
      checklist_items: Array<{
        stage: string
        item_name: string
        is_required: boolean | null
        sort_order: number | null
      }>
    }

    const newStart = new Date(start_date)
    const newEnd = new Date(end_date)

    // Generate unique slug
    let slug = slugify(title)
    const existing = await db.select({ id: events.id }).from(events).where(eq(events.slug, slug)).limit(1)
    if (existing.length > 0) slug = `${slug}-${Date.now()}`

    const eventData = templateData.event

    // Use transaction to create event and all related records
    const newEvent = await db.transaction(async (tx) => {
      const [created] = await tx.insert(events).values({
        title,
        slug,
        description: eventData.description,
        event_type_id: template.event_type_id,
        client_id: client_id ? parseInt(client_id) : null,
        status: 'draft',
        priority: eventData.priority ?? 'medium',
        start_date: newStart,
        end_date: newEnd,
        timezone: eventData.timezone ?? 'Asia/Riyadh',
        venue_name: eventData.venue_name,
        venue_address: eventData.venue_address,
        venue_city: eventData.venue_city,
        venue_country: eventData.venue_country,
        expected_attendees: eventData.expected_attendees,
        budget_estimated: eventData.budget_estimated,
        currency: eventData.currency ?? 'SAR',
        notes: eventData.notes,
        created_by: session.id,
        updated_by: session.id,
      }).returning()

      // Create tasks with adjusted dates
      if (templateData.tasks.length > 0) {
        await tx.insert(tasks).values(
          templateData.tasks.map(t => ({
            event_id: created.id,
            title: t.title,
            description: t.description,
            status: 'todo' as const,
            priority: t.priority ?? 'medium',
            estimated_hours: t.estimated_hours,
            sort_order: t.sort_order ?? 0,
            due_date: t.due_date_offset !== null
              ? new Date(newStart.getTime() + t.due_date_offset * 24 * 60 * 60 * 1000)
              : null,
            start_date: t.start_date_offset !== null
              ? new Date(newStart.getTime() + t.start_date_offset * 24 * 60 * 60 * 1000)
              : null,
            created_by: session.id,
          }))
        )
      }

      // Create sessions with adjusted dates
      if (templateData.sessions.length > 0) {
        await tx.insert(sessions).values(
          templateData.sessions.map(s => ({
            event_id: created.id,
            title: s.title,
            description: s.description,
            session_type: s.session_type,
            date: new Date(newStart.getTime() + s.date_offset * 24 * 60 * 60 * 1000),
            start_time: s.start_time,
            end_time: s.end_time,
            location: s.location,
            capacity: s.capacity,
            sort_order: s.sort_order ?? 0,
          }))
        )
      }

      // Create vendor assignments
      if (templateData.vendors.length > 0) {
        await tx.insert(event_vendors).values(
          templateData.vendors.map(v => ({
            event_id: created.id,
            vendor_id: v.vendor_id,
            service_description: v.service_description,
            contract_amount: v.contract_amount,
            status: 'pending' as const,
            notes: v.notes,
          }))
        )
      }

      // Create checklist items
      if (templateData.checklist_items.length > 0) {
        await tx.insert(event_checklist_items).values(
          templateData.checklist_items.map(c => ({
            event_id: created.id,
            stage: c.stage,
            item_name: c.item_name,
            is_required: c.is_required ?? true,
            sort_order: c.sort_order ?? 0,
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
      details: JSON.stringify({ from_template: templateId }),
    }).catch(() => {})

    return NextResponse.json({ data: newEvent }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
