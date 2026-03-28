import { describe, it, expect, vi, beforeEach } from 'vitest'
import { csrfCheck } from './csrf'

/**
 * Create a minimal NextRequest-like object for testing csrfCheck.
 * We avoid importing NextRequest directly to keep tests lightweight.
 */
function makeMockRequest(opts: {
  method: string
  pathname: string
  cookieToken?: string
  headerToken?: string
}) {
  return {
    method: opts.method,
    nextUrl: { pathname: opts.pathname },
    cookies: {
      get: (name: string) =>
        name === 'teems_csrf' && opts.cookieToken
          ? { value: opts.cookieToken }
          : undefined,
    },
    headers: {
      get: (name: string) =>
        name === 'x-csrf-token' ? (opts.headerToken ?? null) : null,
    },
  } as any
}

describe('csrfCheck', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('skips GET requests', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const req = makeMockRequest({ method: 'GET', pathname: '/api/events' })
    expect(csrfCheck(req)).toBeNull()
  })

  it('skips HEAD requests', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const req = makeMockRequest({ method: 'HEAD', pathname: '/api/events' })
    expect(csrfCheck(req)).toBeNull()
  })

  it('skips OPTIONS requests', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const req = makeMockRequest({ method: 'OPTIONS', pathname: '/api/events' })
    expect(csrfCheck(req)).toBeNull()
  })

  it('skips auth endpoints', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const req = makeMockRequest({ method: 'POST', pathname: '/api/auth/login' })
    expect(csrfCheck(req)).toBeNull()
  })

  it('skips portal invite endpoints', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const req = makeMockRequest({
      method: 'POST',
      pathname: '/api/portal/invite/abc123',
    })
    expect(csrfCheck(req)).toBeNull()
  })

  it('skips non-API routes', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const req = makeMockRequest({ method: 'POST', pathname: '/dashboard' })
    expect(csrfCheck(req)).toBeNull()
  })

  it('skips in development mode', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const req = makeMockRequest({ method: 'POST', pathname: '/api/events' })
    expect(csrfCheck(req)).toBeNull()
  })

  it('skips when NODE_ENV is test (not production)', () => {
    vi.stubEnv('NODE_ENV', 'test')
    const req = makeMockRequest({ method: 'POST', pathname: '/api/events' })
    expect(csrfCheck(req)).toBeNull()
  })

  it('returns 403 when CSRF token is missing in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const req = makeMockRequest({ method: 'POST', pathname: '/api/events' })
    const result = csrfCheck(req)
    expect(result).not.toBeNull()
    // NextResponse.json returns a Response-like object
    expect(result!.status).toBe(403)
  })

  it('returns 403 when cookie token is present but header is missing', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const req = makeMockRequest({
      method: 'POST',
      pathname: '/api/events',
      cookieToken: 'abc',
    })
    const result = csrfCheck(req)
    expect(result).not.toBeNull()
    expect(result!.status).toBe(403)
  })

  it('returns 403 when tokens do not match', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const req = makeMockRequest({
      method: 'POST',
      pathname: '/api/events',
      cookieToken: 'token-a',
      headerToken: 'token-b',
    })
    const result = csrfCheck(req)
    expect(result).not.toBeNull()
    expect(result!.status).toBe(403)
  })

  it('returns null when tokens match in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const req = makeMockRequest({
      method: 'POST',
      pathname: '/api/events',
      cookieToken: 'valid-token-123',
      headerToken: 'valid-token-123',
    })
    expect(csrfCheck(req)).toBeNull()
  })
})
