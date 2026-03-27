import { NextRequest, NextResponse } from 'next/server'
import { getSession, requirePermission } from '@/lib/auth'
import { db } from '@/db'
import { settings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logActivity } from '@/lib/activity'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rows = await db.select().from(settings)
    const map = Object.fromEntries(rows.map(r => [r.key, r.value]))
    return NextResponse.json(map)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    requirePermission(session, 'settings', 'edit')

    const body = await req.json()
    const entries = Object.entries(body) as [string, string][]

    for (const [key, value] of entries) {
      const existing = await db.select().from(settings).where(eq(settings.key, key))
      if (existing.length > 0) {
        await db.update(settings).set({ value: String(value), updated_at: new Date() }).where(eq(settings.key, key))
      } else {
        await db.insert(settings).values({ key, value: String(value) })
      }
    }

    logActivity({ userId: session.id, action: 'updated', resource: 'settings', details: JSON.stringify({ keys: Object.keys(body) }) }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
