import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { events, tasks, vendors, speakers, clients } from '@/db/schema'
import { ilike } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const q = req.nextUrl.searchParams.get('q')?.trim()
    if (!q || q.length < 2) return NextResponse.json({ results: [] })

    const pattern = `%${q}%`

    // Search events
    const eventResults = await db
      .select({ id: events.id, title: events.title, status: events.status })
      .from(events)
      .where(ilike(events.title, pattern))
      .limit(5)

    // Search tasks
    const taskResults = await db
      .select({ id: tasks.id, title: tasks.title, event_id: tasks.event_id, status: tasks.status })
      .from(tasks)
      .where(ilike(tasks.title, pattern))
      .limit(5)

    // Search vendors
    const vendorResults = await db
      .select({ id: vendors.id, name: vendors.name })
      .from(vendors)
      .where(ilike(vendors.name, pattern))
      .limit(5)

    // Search speakers
    const speakerResults = await db
      .select({ id: speakers.id, name: speakers.name })
      .from(speakers)
      .where(ilike(speakers.name, pattern))
      .limit(5)

    // Search clients
    const clientResults = await db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(ilike(clients.name, pattern))
      .limit(5)

    const results = [
      ...eventResults.map(r => ({ type: 'event' as const, id: r.id, name: r.title, href: `/events/${r.id}`, status: r.status })),
      ...taskResults.map(r => ({ type: 'task' as const, id: r.id, name: r.title, href: `/events/${r.event_id}`, status: r.status })),
      ...vendorResults.map(r => ({ type: 'vendor' as const, id: r.id, name: r.name, href: `/vendors`, status: null })),
      ...speakerResults.map(r => ({ type: 'speaker' as const, id: r.id, name: r.name, href: `/speakers`, status: null })),
      ...clientResults.map(r => ({ type: 'client' as const, id: r.id, name: r.name, href: `/clients`, status: null })),
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
