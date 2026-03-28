import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { plan_rules } from '@/db/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rules = await db.select().from(plan_rules).orderBy(desc(plan_rules.priority))
  return NextResponse.json(rules.map(r => ({
    ...r,
    condition: JSON.parse(r.condition),
    actions: JSON.parse(r.actions),
  })))
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const [rule] = await db.insert(plan_rules).values({
    name: body.name,
    description: body.description || null,
    category: body.category,
    condition: JSON.stringify(body.condition),
    actions: JSON.stringify(body.actions),
    priority: body.priority || 100,
  }).returning()

  return NextResponse.json(rule, { status: 201 })
}
