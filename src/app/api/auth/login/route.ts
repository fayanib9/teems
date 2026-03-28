import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, roles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth'

// ─── Rate Limiting ──────────────────────────────────────────
// Uses Upstash Redis when configured (production-safe, works across instances).
// Falls back to in-memory Map for local development.

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const MAX_ATTEMPTS = 5
const WINDOW_SECONDS = 900 // 15 minutes

// Build rate limiter — only when Redis is configured
function buildRateLimiter(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) return null

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(MAX_ATTEMPTS, `${WINDOW_SECONDS} s`),
    prefix: 'teems:login',
  })
}

let ratelimit: Ratelimit | null = null
function getRateLimiter(): Ratelimit | null {
  if (ratelimit) return ratelimit
  try {
    ratelimit = buildRateLimiter()
    return ratelimit
  } catch {
    // Redis not configured — skip rate limiting in dev
    return null
  }
}

function getRateLimitKey(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    const ip = getRateLimitKey(request)

    // Rate limit check
    const limiter = getRateLimiter()
    if (limiter) {
      try {
        const { success } = await limiter.limit(ip)
        if (!success) {
          return NextResponse.json(
            { error: 'Too many login attempts. Try again later.' },
            { status: 429 }
          )
        }
      } catch {
        // If Redis is down, allow the request through rather than blocking all logins
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
