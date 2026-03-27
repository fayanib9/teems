import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { activity_logs, users, events } from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'activity', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = req.nextUrl.searchParams
    const event_id = url.get('event_id')
    const user_id = url.get('user_id')
    const resource = url.get('resource')
    const limit = parseInt(url.get('limit') || '50')

    const conditions = []
    if (event_id) conditions.push(eq(activity_logs.event_id, parseInt(event_id)))
    if (user_id) conditions.push(eq(activity_logs.user_id, parseInt(user_id)))
    if (resource) conditions.push(eq(activity_logs.resource, resource))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db
      .select({
        id: activity_logs.id,
        user_id: activity_logs.user_id,
        event_id: activity_logs.event_id,
        action: activity_logs.action,
        resource: activity_logs.resource,
        resource_id: activity_logs.resource_id,
        details: activity_logs.details,
        ip_address: activity_logs.ip_address,
        created_at: activity_logs.created_at,
        user_first_name: users.first_name,
        user_last_name: users.last_name,
        event_title: events.title,
        event_slug: events.slug,
      })
      .from(activity_logs)
      .leftJoin(users, eq(activity_logs.user_id, users.id))
      .leftJoin(events, eq(activity_logs.event_id, events.id))
      .where(where)
      .orderBy(desc(activity_logs.created_at))
      .limit(limit)

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
