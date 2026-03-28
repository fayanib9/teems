import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { event_sponsors, sponsors } from '@/db/schema-extensions'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const rows = await db
      .select({
        id: event_sponsors.id,
        event_id: event_sponsors.event_id,
        sponsor_id: event_sponsors.sponsor_id,
        tier: event_sponsors.tier,
        commitment_amount: event_sponsors.commitment_amount,
        paid_amount: event_sponsors.paid_amount,
        deliverables: event_sponsors.deliverables,
        deliverables_completed: event_sponsors.deliverables_completed,
        logo_placement: event_sponsors.logo_placement,
        status: event_sponsors.status,
        contract_path: event_sponsors.contract_path,
        notes: event_sponsors.notes,
        created_at: event_sponsors.created_at,
        sponsor_name: sponsors.name,
        sponsor_contact_name: sponsors.contact_name,
        sponsor_email: sponsors.email,
        sponsor_phone: sponsors.phone,
        sponsor_website: sponsors.website,
        sponsor_logo_path: sponsors.logo_path,
        sponsor_industry: sponsors.industry,
      })
      .from(event_sponsors)
      .innerJoin(sponsors, eq(event_sponsors.sponsor_id, sponsors.id))
      .where(eq(event_sponsors.event_id, Number(id)))

    return NextResponse.json(rows)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'events', 'edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { sponsor_id, tier, commitment_amount, paid_amount, deliverables, logo_placement, contract_path, notes, status } = body

    if (!sponsor_id) return NextResponse.json({ error: 'sponsor_id required' }, { status: 400 })

    const [row] = await db.insert(event_sponsors).values({
      event_id: Number(id),
      sponsor_id: Number(sponsor_id),
      tier: tier || 'silver',
      commitment_amount: commitment_amount ? Number(commitment_amount) : null,
      paid_amount: paid_amount ? Number(paid_amount) : 0,
      deliverables: deliverables || null,
      logo_placement: logo_placement || null,
      contract_path: contract_path || null,
      notes: notes || null,
      status: status || 'pending',
    }).returning()

    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

