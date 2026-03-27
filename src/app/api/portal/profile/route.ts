import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { speakers } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role_name !== 'speaker') {
      return NextResponse.json({ error: 'Forbidden — speaker role required' }, { status: 403 })
    }

    const speakerRecord = await db
      .select()
      .from(speakers)
      .where(eq(speakers.user_id, session.id))
      .limit(1)

    if (!speakerRecord[0]) return NextResponse.json({ error: 'No linked speaker record' }, { status: 404 })

    return NextResponse.json({ data: speakerRecord[0] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role_name !== 'speaker') {
      return NextResponse.json({ error: 'Forbidden — speaker role required' }, { status: 403 })
    }

    const speakerRecord = await db
      .select({ id: speakers.id })
      .from(speakers)
      .where(eq(speakers.user_id, session.id))
      .limit(1)

    if (!speakerRecord[0]) return NextResponse.json({ error: 'No linked speaker record' }, { status: 404 })

    const body = await req.json()
    const allowedFields = ['bio', 'title', 'organization', 'photo_path', 'website', 'social_links'] as const
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    updates.updated_at = new Date()

    await db
      .update(speakers)
      .set(updates)
      .where(eq(speakers.id, speakerRecord[0].id))

    const updated = await db
      .select()
      .from(speakers)
      .where(eq(speakers.id, speakerRecord[0].id))
      .limit(1)

    return NextResponse.json({ data: updated[0] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
