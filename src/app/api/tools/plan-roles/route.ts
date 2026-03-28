import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { plan_roles } from '@/db/schema'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = await db.select().from(plan_roles)
  return NextResponse.json(roles)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const [role] = await db.insert(plan_roles).values({
    name: body.name,
    color: body.color || '#6B7280',
    description: body.description || null,
  }).returning()

  return NextResponse.json(role, { status: 201 })
}
