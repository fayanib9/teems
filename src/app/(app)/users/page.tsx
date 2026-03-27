import { getSession, hasPermission } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { users, roles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { UsersPageClient } from './users-page-client'

export default async function UsersPage() {
  const session = await getSession()
  if (!session) return null
  if (!hasPermission(session, 'users', 'view')) redirect('/dashboard')

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      first_name: users.first_name,
      last_name: users.last_name,
      phone: users.phone,
      role_id: users.role_id,
      user_type: users.user_type,
      is_active: users.is_active,
      last_login_at: users.last_login_at,
      created_at: users.created_at,
      role_name: roles.name,
      role_display: roles.display_name,
    })
    .from(users)
    .leftJoin(roles, eq(users.role_id, roles.id))
    .orderBy(users.first_name)

  const allRoles = await db.select().from(roles).orderBy(roles.name)

  return <UsersPageClient users={allUsers} roles={allRoles} />
}
