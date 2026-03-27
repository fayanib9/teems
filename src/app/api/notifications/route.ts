import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { eq, and, desc, count } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.user_id, session.id))
      .orderBy(desc(notifications.created_at))
      .limit(20)

    const [unreadResult] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.user_id, session.id), eq(notifications.is_read, false)))

    return NextResponse.json({
      data: rows,
      unread_count: unreadResult.count,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { notification_id, mark_all } = body

    if (mark_all) {
      await db
        .update(notifications)
        .set({ is_read: true })
        .where(and(eq(notifications.user_id, session.id), eq(notifications.is_read, false)))

      return NextResponse.json({ success: true })
    }

    if (notification_id) {
      await db
        .update(notifications)
        .set({ is_read: true })
        .where(and(eq(notifications.id, notification_id), eq(notifications.user_id, session.id)))

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Provide notification_id or mark_all' }, { status: 400 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
