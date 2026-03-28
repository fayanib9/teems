import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { csrfCheck } from '@/lib/csrf'

const JWT_SECRET: string = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET is required in production') })() : 'teems-dev-secret-NOT-FOR-PRODUCTION')
const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password', '/api/auth/login', '/api/auth/forgot-password', '/api/auth/reset-password', '/api/health', '/invite', '/api/portal/invite/accept']
const EXTERNAL_ROLES = ['client', 'vendor', 'speaker', 'exhibitor']

function decodeToken(token: string): { userId: number; email: string; role_name?: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role_name?: string }
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('teems_token')?.value

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (pathname === '/login' && token) {
      const decoded = decodeToken(token)
      if (decoded?.role_name && EXTERNAL_ROLES.includes(decoded.role_name)) {
        return NextResponse.redirect(new URL('/portal', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Redirect root
  if (pathname === '/') {
    if (token) {
      const decoded = decodeToken(token)
      if (decoded?.role_name && EXTERNAL_ROLES.includes(decoded.role_name)) {
        return NextResponse.redirect(new URL('/portal', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Protect all other routes
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // External user isolation: restrict to /portal/* and /api/portal/*
  const decoded = decodeToken(token)
  if (decoded?.role_name && EXTERNAL_ROLES.includes(decoded.role_name)) {
    const allowed = pathname.startsWith('/portal') || pathname.startsWith('/api/portal') || pathname.startsWith('/api/auth')
    if (!allowed) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/portal', request.url))
    }
  }

  // Internal user: block /portal/* routes
  if (decoded && (!decoded.role_name || !EXTERNAL_ROLES.includes(decoded.role_name))) {
    if (pathname.startsWith('/portal')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // CSRF check for state-changing API requests (production only)
  const csrfError = csrfCheck(request)
  if (csrfError) return csrfError

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
