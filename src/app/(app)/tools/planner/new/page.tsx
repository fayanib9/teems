import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { event_types, clients } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { WizardClient } from './wizard-client'

export default async function NewPlanPage() {
  const session = await getSession()
  if (!session) return null

  const types = await db.select({ id: event_types.id, name: event_types.name })
    .from(event_types)
    .where(eq(event_types.is_active, true))

  const clientList = await db.select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.is_active, true))

  return <WizardClient eventTypes={types} clients={clientList} />
}
