import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { event_issues, users } from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const rows = await db
    .select({
      id: event_issues.id,
      title: event_issues.title,
      description: event_issues.description,
      severity: event_issues.severity,
      status: event_issues.status,
      reported_by: event_issues.reported_by,
      assigned_to: event_issues.assigned_to,
      resolution: event_issues.resolution,
      resolved_at: event_issues.resolved_at,
      created_at: event_issues.created_at,
    })
    .from(event_issues)
    .where(eq(event_issues.event_id, Number(id)))
    .orderBy(desc(event_issues.created_at))

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { title, description, severity, assigned_to } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const [issue] = await db.insert(event_issues).values({
    event_id: Number(id),
    title: title.trim(),
    description: description || null,
    severity: severity || 'medium',
    reported_by: session.id,
    assigned_to: assigned_to ? Number(assigned_to) : null,
  }).returning()

  return NextResponse.json(issue, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { issue_id, status, resolution, assigned_to } = body

  if (!issue_id) return NextResponse.json({ error: 'issue_id required' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date() }
  if (status !== undefined) {
    updates.status = status
    if (status === 'resolved') updates.resolved_at = new Date()
  }
  if (resolution !== undefined) updates.resolution = resolution
  if (assigned_to !== undefined) updates.assigned_to = assigned_to ? Number(assigned_to) : null

  const [issue] = await db.update(event_issues).set(updates).where(eq(event_issues.id, Number(issue_id))).returning()
  return NextResponse.json(issue)
}
