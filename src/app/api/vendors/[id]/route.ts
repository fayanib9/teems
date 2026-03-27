import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { vendors } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'vendors', 'edit')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const numId = parseInt(id)
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }
    const body = await req.json()
    const updateData: Record<string, unknown> = { updated_at: new Date() }
    const fields = ['name', 'category', 'contact_name', 'email', 'phone', 'address', 'website', 'tax_number', 'notes', 'rating']
    for (const f of fields) { if (f in body) updateData[f] = body[f] }

    const [updated] = await db.update(vendors).set(updateData).where(eq(vendors.id, numId)).returning()
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'vendors', 'delete')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const numId = parseInt(id)
    if (isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }
    await db.update(vendors).set({ is_active: false, updated_at: new Date() }).where(eq(vendors.id, numId))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
