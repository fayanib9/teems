import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { teams, team_members, users } from '@/db/schema'
import { eq, desc, count, sql } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'teams', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rows = await db
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
      .where(eq(teams.is_active, true))
      .orderBy(teams.name)

    // Get member counts
    const teamIds = rows.map(r => r.id)
    const memberCounts = teamIds.length > 0
      ? await db
          .select({ team_id: team_members.team_id, count: count() })
          .from(team_members)
          .where(sql`${team_members.team_id} IN (${sql.join(teamIds.map(id => sql`${id}`), sql`, `)})`)
          .groupBy(team_members.team_id)
      : []

    const countMap = Object.fromEntries(memberCounts.map(m => [m.team_id, m.count]))

    return NextResponse.json({
      data: rows.map(r => ({ ...r, member_count: countMap[r.id] || 0 })),
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'teams', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, description, lead_id, color } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

    const [team] = await db.insert(teams).values({
      name,
      description: description || null,
      lead_id: lead_id || null,
      color: color || '#312C6A',
    }).returning()

    return NextResponse.json({ data: team }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
