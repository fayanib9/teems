import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { vendor_match_results } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { VendorMatchClient } from './vendor-match-client'

export default async function VendorMatchPage() {
  const session = await getSession()
  if (!session) return null

  const matches = await db
    .select({
      id: vendor_match_results.id,
      criteria: vendor_match_results.criteria,
      created_at: vendor_match_results.created_at,
    })
    .from(vendor_match_results)
    .orderBy(desc(vendor_match_results.created_at))

  return <VendorMatchClient matches={matches.map(m => ({ ...m, criteria: JSON.parse(m.criteria) }))} />
}
