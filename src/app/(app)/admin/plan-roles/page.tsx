import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { plan_roles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { RolesClient } from './roles-client'

export default async function PlanRolesPage() {
  const session = await getSession()
  if (!session) return null

  const roles = await db.select().from(plan_roles).where(eq(plan_roles.is_active, true))
  return <RolesClient roles={roles} />
}
