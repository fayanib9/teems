import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, roles } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password, first_name, last_name } = body as {
      token: string
      password: string
      first_name?: string
      last_name?: string
    }

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Find user with this invite token
    const inviteMarker = `invite:${token}`
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        role_id: users.role_id,
        is_active: users.is_active,
      })
      .from(users)
      .where(eq(users.password_hash, inviteMarker))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired invite token' }, { status: 404 })
    }

    if (user.is_active) {
      return NextResponse.json({ error: 'This invite has already been accepted' }, { status: 400 })
    }

    // Hash password and activate user
    const passwordHash = await hashPassword(password)
    const updateData: Record<string, unknown> = {
      password_hash: passwordHash,
      is_active: true,
      updated_at: new Date(),
    }

    if (first_name) updateData.first_name = first_name
    if (last_name) updateData.last_name = last_name

    await db.update(users).set(updateData).where(eq(users.id, user.id))

    // Get role name for token
    let roleName: string | undefined
    if (user.role_id) {
      const [role] = await db.select({ name: roles.name }).from(roles).where(eq(roles.id, user.role_id)).limit(1)
      roleName = role?.name
    }

    // Create auth token and set cookie
    const authToken = createToken({ userId: user.id, email: user.email, role_name: roleName })
    await setAuthCookie(authToken)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: first_name || user.first_name,
        last_name: last_name || user.last_name,
        role: roleName,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET to validate a token
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const inviteMarker = `invite:${token}`
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        is_active: users.is_active,
        role_id: users.role_id,
      })
      .from(users)
      .where(eq(users.password_hash, inviteMarker))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired invite token' }, { status: 404 })
    }

    if (user.is_active) {
      return NextResponse.json({ error: 'This invite has already been accepted' }, { status: 400 })
    }

    let roleName: string | undefined
    if (user.role_id) {
      const [role] = await db.select({ name: roles.name }).from(roles).where(eq(roles.id, user.role_id)).limit(1)
      roleName = role?.name
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: roleName,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
