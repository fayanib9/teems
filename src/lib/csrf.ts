import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const CSRF_COOKIE = 'teems_csrf'
const CSRF_HEADER = 'x-csrf-token'

/**
 * Generate and set a CSRF token cookie (double-submit cookie pattern).
 * Call this when rendering pages that contain forms.
 */
export async function ensureCsrfToken(): Promise<string> {
  const cookieStore = await cookies()
  const existing = cookieStore.get(CSRF_COOKIE)?.value
  if (existing) return existing

  const token = crypto.randomUUID()
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: false, // Must be readable by JS to send in header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })
  return token
}

/**
 * Constant-time string comparison using Web Crypto API (Edge-compatible).
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const encoder = new TextEncoder()
  const bufA = encoder.encode(a)
  const bufB = encoder.encode(b)
  let result = 0
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i]
  }
  return result === 0
}

/**
 * Middleware-level CSRF check for state-changing API requests.
 * Uses constant-time comparison to prevent timing attacks.
 * Returns null if valid, or an error response if invalid.
 */
export function csrfCheck(req: NextRequest): NextResponse | null {
  // Only check state-changing methods on API routes
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return null
  if (!req.nextUrl.pathname.startsWith('/api/')) return null

  // Skip auth endpoints (login needs to work without CSRF token initially)
  if (req.nextUrl.pathname.startsWith('/api/auth/')) return null
  // Skip portal invite acceptance
  if (req.nextUrl.pathname.startsWith('/api/portal/invite/')) return null

  // Skip in development for convenience
  if (process.env.NODE_ENV !== 'production') return null

  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value
  const headerToken = req.headers.get(CSRF_HEADER)

  if (!cookieToken || !headerToken) {
    return NextResponse.json({ error: 'CSRF token missing' }, { status: 403 })
  }

  if (!constantTimeEqual(cookieToken, headerToken)) {
    return NextResponse.json({ error: 'CSRF token invalid' }, { status: 403 })
  }

  return null
}
