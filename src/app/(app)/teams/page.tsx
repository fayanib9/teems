import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { teams, team_members, users } from '@/db/schema'
import { eq, count, sql } from 'drizzle-orm'
import { TeamsPageClient } from './teams-page-client'

export default async function TeamsPage() {
  const session = await getSession()
  if (!session) return null

  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      lead_id: teams.lead_id,
      color: teams.color,
      created_at: teams.created_at,
      lead_first_name: users.first_name,
      lead_last_name: users.last_name,
    })
    .from(teams)
    .leftJoin(users, eq(teams.lead_id, users.id))
    .where(eq(teams.is_active, true))
    .orderBy(teams.name)

  const teamIds = rows.map(r => r.id)
  const memberCounts = teamIds.length > 0
    ? await db
        .select({ team_id: team_members.team_id, count: count() })
        .from(team_members)
        .where(sql`${team_members.team_id} IN (${sql.join(teamIds.map(id => sql`${id}`), sql`, `)})`)
        .groupBy(team_members.team_id)
    : []

  const countMap = Object.fromEntries(memberCounts.map(m => [m.team_id, m.count]))
  const data = rows.map(r => ({ ...r, member_count: countMap[r.id] || 0 }))

  const userList = await db
    .select({ id: users.id, first_name: users.first_name, last_name: users.last_name })
    .from(users)
    .where(eq(users.is_active, true))
    .orderBy(users.first_name)

  const canCreate = hasPermission(session, 'teams', 'create')
  const canEdit = hasPermission(session, 'teams', 'edit')

  return <TeamsPageClient teams={data} users={userList} canCreate={canCreate} canEdit={canEdit} />
}
