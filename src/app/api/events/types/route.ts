import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { event_types } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const types = await db
    .select()
    .from(event_types)
    .where(eq(event_types.is_active, true))

  return NextResponse.json({ data: types })
}
