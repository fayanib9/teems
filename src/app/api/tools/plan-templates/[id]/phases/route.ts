import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { plan_template_phases } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const phases = await db.select().from(plan_template_phases).where(eq(plan_template_phases.template_id, parseInt(id))).orderBy(asc(plan_template_phases.sort_order))
  return NextResponse.json(phases)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const [phase] = await db.insert(plan_template_phases).values({
    template_id: parseInt(id),
    name: body.name,
    sort_order: body.sort_order || 99,
    color: body.color || '#6B7280',
    icon: body.icon || 'Circle',
  }).returning()

  return NextResponse.json(phase, { status: 201 })
}
