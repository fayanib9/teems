import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { event_speakers, speakers, sessions } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const rows = await db
      .select({
        id: event_speakers.id,
        event_id: event_speakers.event_id,
        speaker_id: event_speakers.speaker_id,
        session_id: event_speakers.session_id,
        role: event_speakers.role,
        fee: event_speakers.fee,
        status: event_speakers.status,
        travel_required: event_speakers.travel_required,
        accommodation_notes: event_speakers.accommodation_notes,
        notes: event_speakers.notes,
        created_at: event_speakers.created_at,
        speaker_name: speakers.name,
        speaker_title: speakers.title,
        speaker_organization: speakers.organization,
        speaker_email: speakers.email,
        speaker_phone: speakers.phone,
        speaker_photo_path: speakers.photo_path,
        session_title: sessions.title,
      })
      .from(event_speakers)
      .innerJoin(speakers, eq(event_speakers.speaker_id, speakers.id))
      .leftJoin(sessions, eq(event_speakers.session_id, sessions.id))
      .where(eq(event_speakers.event_id, Number(id)))

    return NextResponse.json(rows)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authSession = await getSession()
    if (!authSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(authSession, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { speaker_id, role, fee, session_id, notes } = body

    if (!speaker_id) return NextResponse.json({ error: 'speaker_id required' }, { status: 400 })

    const [row] = await db.insert(event_speakers).values({
      event_id: Number(id),
      speaker_id: Number(speaker_id),
      role: role || 'speaker',
      fee: fee ? Number(fee) : null,
      session_id: session_id ? Number(session_id) : null,
      notes: notes || null,
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authSession = await getSession()
    if (!authSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(authSession, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const assignmentId = searchParams.get('assignment_id')

    if (!assignmentId) return NextResponse.json({ error: 'assignment_id required' }, { status: 400 })

    await db.delete(event_speakers).where(eq(event_speakers.id, Number(assignmentId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
