import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { teams, team_members, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const [team] = await db
    .select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      lead_id: teams.lead_id,
      color: teams.color,
      is_active: teams.is_active,
      created_at: teams.created_at,
      lead_first_name: users.first_name,
      lead_last_name: users.last_name,
    })
    .from(teams)
    .leftJoin(users, eq(teams.lead_id, users.id))
    .where(eq(teams.id, parseInt(id)))
    .limit(1)

  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const members = await db
    .select({
      id: team_members.id,
      user_id: team_members.user_id,
      joined_at: team_members.joined_at,
      first_name: users.first_name,
      last_name: users.last_name,
      email: users.email,
    })
    .from(team_members)
    .innerJoin(users, eq(team_members.user_id, users.id))
    .where(eq(team_members.team_id, parseInt(id)))

  return NextResponse.json({ data: { ...team, members } })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session, 'teams', 'edit')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const updateData: Record<string, unknown> = {}
  if ('name' in body) updateData.name = body.name
  if ('description' in body) updateData.description = body.description
  if ('lead_id' in body) updateData.lead_id = body.lead_id
  if ('color' in body) updateData.color = body.color
  if ('is_active' in body) updateData.is_active = body.is_active

  const [updated] = await db.update(teams).set(updateData).where(eq(teams.id, parseInt(id))).returning()
  if (!updated) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasPermission(session, 'teams', 'delete')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const [updated] = await db.update(teams).set({ is_active: false }).where(eq(teams.id, parseInt(id))).returning({ id: teams.id })
  if (!updated) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}
