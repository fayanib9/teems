import { getSession } from '@/lib/auth'
import { MatchFormClient } from './match-form-client'

export default async function NewVendorMatchPage() {
  const session = await getSession()
  if (!session) return null
  return <MatchFormClient />
}
