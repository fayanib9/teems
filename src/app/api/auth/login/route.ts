import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, roles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        password_hash: users.password_hash,
        first_name: users.first_name,
        last_name: users.last_name,
        is_active: users.is_active,
        role_name: roles.name,
      })
      .from(users)
      .leftJoin(roles, eq(users.role_id, roles.id))
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (!user[0]) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user[0].is_active) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
    }

    const valid = await verifyPassword(password, user[0].password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Update last login
    await db
      .update(users)
      .set({ last_login_at: new Date() })
      .where(eq(users.id, user[0].id))

    const token = createToken({ userId: user[0].id, email: user[0].email })
    await setAuthCookie(token)

    return NextResponse.json({
      user: {
        id: user[0].id,
        email: user[0].email,
        first_name: user[0].first_name,
        last_name: user[0].last_name,
        role: user[0].role_name,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
