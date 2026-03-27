import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { db } from '@/db'
import { users, roles, role_permissions, permissions } from '@/db/schema'
import { eq } from 'drizzle-orm'

const JWT_SECRET = process.env.JWT_SECRET || 'teems-dev-secret'
const COOKIE_NAME = 'teems_token'
const TOKEN_EXPIRY = '7d'

export type SessionUser = {
  id: number
  email: string
  first_name: string
  last_name: string
  role_id: number
  role_name: string
  user_type: string
  permissions: string[]
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function createToken(payload: { userId: number; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

export function verifyToken(token: string): { userId: number; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string }
  } catch {
    return null
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const user = await db
    .select({
      id: users.id,
      email: users.email,
      first_name: users.first_name,
      last_name: users.last_name,
      role_id: users.role_id,
      user_type: users.user_type,
      is_active: users.is_active,
      role_name: roles.name,
    })
    .from(users)
    .leftJoin(roles, eq(users.role_id, roles.id))
    .where(eq(users.id, payload.userId))
    .limit(1)

  if (!user[0] || !user[0].is_active) return null

  const userPerms = await db
    .select({
      module: permissions.module,
      action: permissions.action,
    })
    .from(role_permissions)
    .innerJoin(permissions, eq(role_permissions.permission_id, permissions.id))
    .where(eq(role_permissions.role_id, user[0].role_id!))

  return {
    id: user[0].id,
    email: user[0].email,
    first_name: user[0].first_name,
    last_name: user[0].last_name,
    role_id: user[0].role_id!,
    role_name: user[0].role_name || 'unknown',
    user_type: user[0].user_type,
    permissions: userPerms.map((p) => `${p.module}:${p.action}`),
  }
}

export function hasPermission(session: SessionUser, module: string, action: string): boolean {
  if (session.role_name === 'super_admin') return true
  return session.permissions.includes(`${module}:${action}`)
}

export function requirePermission(session: SessionUser, module: string, action: string): void {
  if (!hasPermission(session, module, action)) {
    throw new Error('Forbidden')
  }
}
