import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { users, roles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const all = req.nextUrl.searchParams.get('all')

    // Minimal list for dropdowns
    if (all === 'true') {
      const rows = await db
        .select({ id: users.id, first_name: users.first_name, last_name: users.last_name, email: users.email })
        .from(users)
        .where(eq(users.is_active, true))
        .orderBy(users.first_name)
      return NextResponse.json({ data: rows })
    }

    // Full list (admin only)
    if (!hasPermission(session, 'users', 'view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        phone: users.phone,
        role_id: users.role_id,
        user_type: users.user_type,
        is_active: users.is_active,
        last_login_at: users.last_login_at,
        created_at: users.created_at,
        role_name: roles.name,
        role_display: roles.display_name,
      })
      .from(users)
      .leftJoin(roles, eq(users.role_id, roles.id))
      .where(eq(users.is_active, true))
      .orderBy(users.first_name)

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
