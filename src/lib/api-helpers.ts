import { NextResponse } from 'next/server'
import { getSession, type SessionUser, hasPermission } from './auth'

// ─── Standard API Response Envelope ──────────────────────────

type ApiResponse<T = unknown> = {
  data?: T
  meta?: {
    total?: number
    page?: number
    per_page?: number
  }
  error?: string
}

export function apiSuccess<T>(data: T, meta?: ApiResponse['meta'], status = 200) {
  const body: ApiResponse<T> = { data }
  if (meta) body.meta = meta
  return NextResponse.json(body, { status })
}

export function apiError(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}

export function apiNotFound(resource = 'Resource') {
  return apiError(`${resource} not found`, 404)
}

export function apiUnauthorized() {
  return apiError('Unauthorized', 401)
}

export function apiForbidden() {
  return apiError('Forbidden', 403)
}

// ─── Auth Helpers ────────────────────────────────────────────

export async function requireAuth(): Promise<SessionUser | NextResponse> {
  const session = await getSession()
  if (!session) return apiUnauthorized()
  return session
}

export async function requirePerm(module: string, action: string): Promise<SessionUser | NextResponse> {
  const session = await getSession()
  if (!session) return apiUnauthorized()
  if (!hasPermission(session, module, action)) return apiForbidden()
  return session
}

export function isErrorResponse(result: SessionUser | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}

// ─── Pagination ──────────────────────────────────────────────

export function parsePagination(searchParams: URLSearchParams, defaultPerPage = 25) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const per_page = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || String(defaultPerPage))))
  const offset = (page - 1) * per_page
  return { page, per_page, offset }
}

// ─── Request Body Size Check ─────────────────────────────────

const MAX_BODY_SIZE = 1024 * 1024 // 1MB for JSON payloads

export async function parseJsonBody<T = Record<string, unknown>>(request: Request): Promise<T | NextResponse> {
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return apiError('Request body too large', 413)
  }

  try {
    const body = await request.json()
    return body as T
  } catch {
    return apiError('Invalid JSON body', 400)
  }
}

// ─── Sanitization ────────────────────────────────────────────

/**
 * Strip HTML tags from a string to prevent XSS.
 * Allows plain text only.
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Sanitize all string values in an object
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj }
  for (const key in result) {
    if (typeof result[key] === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeHtml(result[key] as string)
    }
  }
  return result
}
