import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { vendor_match_results } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { matchVendors } from '@/engine/vendor-matcher'
import type { VendorMatchCriteria } from '@/engine/types'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const matches = await db
    .select()
    .from(vendor_match_results)
    .orderBy(desc(vendor_match_results.created_at))

  return NextResponse.json(matches.map(m => ({
    ...m,
    criteria: JSON.parse(m.criteria),
    matches: JSON.parse(m.matches),
  })))
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const criteria: VendorMatchCriteria = {
      event_id: body.event_id || undefined,
      services_needed: body.services_needed || [],
      budget_range: body.budget_range || '500k_2m',
      event_type: body.event_type || 'conference',
      attendees: body.attendees || 500,
      event_date: body.event_date || '',
    }

    const results = await matchVendors(criteria)

    const [saved] = await db
      .insert(vendor_match_results)
      .values({
        event_id: criteria.event_id || null,
        criteria: JSON.stringify(criteria),
        matches: JSON.stringify(results),
        created_by: session.id,
      })
      .returning({ id: vendor_match_results.id })

    return NextResponse.json({ id: saved.id, matches: results }, { status: 201 })
  } catch (err) {
    console.error('Vendor match error:', err)
    return NextResponse.json({ error: 'Failed to match vendors' }, { status: 500 })
  }
}
