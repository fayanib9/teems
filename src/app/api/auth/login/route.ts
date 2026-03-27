import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, roles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth'

const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function getRateLimitKey(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    const ip = getRateLimitKey(request)
    const now = Date.now()
    const entry = rateLimitMap.get(ip)

    if (entry) {
      if (now > entry.resetAt) {
        rateLimitMap.delete(ip)
      } else if (entry.count >= MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: 'Too many login attempts. Try again later.' },
          { status: 429 }
        )
      }
    }

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
      const current = rateLimitMap.get(ip)
      rateLimitMap.set(ip, {
        count: (current ? current.count : 0) + 1,
        resetAt: current ? current.resetAt : now + RATE_LIMIT_WINDOW,
      })
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user[0].is_active) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
    }

    const valid = await verifyPassword(password, user[0].password_hash)
    if (!valid) {
      const current = rateLimitMap.get(ip)
      rateLimitMap.set(ip, {
        count: (current ? current.count : 0) + 1,
        resetAt: current ? current.resetAt : now + RATE_LIMIT_WINDOW,
      })
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Successful login — clear rate limit
    rateLimitMap.delete(ip)

    // Update last login
    await db
      .update(users)
      .set({ last_login_at: new Date() })
      .where(eq(users.id, user[0].id))

    const token = createToken({ userId: user[0].id, email: user[0].email, role_name: user[0].role_name || undefined })
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
