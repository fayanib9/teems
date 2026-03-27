import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { team_members } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session, 'teams', 'edit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { user_id } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'user_id is required' }, { status: 400 })

  try {
    const [member] = await db.insert(team_members).values({
      team_id: parseInt(id),
      user_id,
    }).returning()
    return NextResponse.json({ data: member }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'User already in team' }, { status: 409 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session, 'teams', 'edit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const { user_id } = await req.json()

  const [deleted] = await db
    .delete(team_members)
    .where(and(eq(team_members.team_id, parseInt(id)), eq(team_members.user_id, user_id)))
    .returning({ id: team_members.id })

  if (!deleted) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
