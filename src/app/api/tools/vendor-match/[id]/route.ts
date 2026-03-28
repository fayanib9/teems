import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { vendor_match_results } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const matchId = parseInt(id)
  if (isNaN(matchId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

  const [match] = await db.select().from(vendor_match_results).where(eq(vendor_match_results.id, matchId)).limit(1)
  if (!match) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    ...match,
    criteria: JSON.parse(match.criteria),
    matches: JSON.parse(match.matches),
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await db.delete(vendor_match_results).where(eq(vendor_match_results.id, parseInt(id)))
  return NextResponse.json({ success: true })
}
