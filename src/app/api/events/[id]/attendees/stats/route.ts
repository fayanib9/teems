import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { attendees } from '@/db/schema-extensions'
import { eq, and, count, sql } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const eventId = Number(id)

    const [totals] = await db
      .select({ count: count() })
      .from(attendees)
      .where(eq(attendees.event_id, eventId))

    const byStatus = await db
      .select({
        status: attendees.status,
        count: count(),
      })
      .from(attendees)
      .where(eq(attendees.event_id, eventId))
      .groupBy(attendees.status)

    const byType = await db
      .select({
        registration_type: attendees.registration_type,
        count: count(),
      })
      .from(attendees)
      .where(eq(attendees.event_id, eventId))
      .groupBy(attendees.registration_type)

    const statusMap: Record<string, number> = {}
    for (const row of byStatus) {
      statusMap[row.status || 'unknown'] = row.count
    }

    const typeMap: Record<string, number> = {}
    for (const row of byType) {
      typeMap[row.registration_type || 'general'] = row.count
    }

    return NextResponse.json({
      total: totals.count,
      registered: statusMap['registered'] || 0,
      confirmed: statusMap['confirmed'] || 0,
      checked_in: statusMap['checked_in'] || 0,
      cancelled: statusMap['cancelled'] || 0,
      no_show: statusMap['no_show'] || 0,
      by_type: typeMap,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
