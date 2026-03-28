import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { vendor_match_results } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { MatchResultClient } from './match-result-client'

export default async function VendorMatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return null

  const { id } = await params
  const matchId = parseInt(id)
  if (isNaN(matchId)) notFound()

  const [match] = await db.select().from(vendor_match_results).where(eq(vendor_match_results.id, matchId)).limit(1)
  if (!match) notFound()

  return (
    <MatchResultClient
      result={{
        ...match,
        criteria: JSON.parse(match.criteria),
        matches: JSON.parse(match.matches),
      }}
    />
  )
}
