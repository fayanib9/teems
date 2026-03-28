import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { activity_logs, users, events } from '@/db/schema'
import { eq, desc, and, gte, lte, count, sql } from 'drizzle-orm'

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
    const action = url.get('action')
    const date_from = url.get('date_from')
    const date_to = url.get('date_to')
    const limit = parseInt(url.get('limit') || '20')
    const offset = parseInt(url.get('offset') || '0')

    const conditions = []
    if (event_id) conditions.push(eq(activity_logs.event_id, parseInt(event_id)))
    if (user_id) conditions.push(eq(activity_logs.user_id, parseInt(user_id)))
    if (resource) conditions.push(eq(activity_logs.resource, resource))
    if (action) conditions.push(eq(activity_logs.action, action))
    if (date_from) conditions.push(gte(activity_logs.created_at, new Date(date_from)))
    if (date_to) {
      const endDate = new Date(date_to)
      endDate.setHours(23, 59, 59, 999)
      conditions.push(lte(activity_logs.created_at, endDate))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [totalResult] = await db
      .select({ count: count() })
      .from(activity_logs)
      .where(where)

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
      .offset(offset)

    return NextResponse.json({ data: rows, total: totalResult.count })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
