import { NextRequest, NextResponse } from 'next/server'
import { getSession, hasPermission } from '@/lib/auth'
import { db } from '@/db'
import { users, roles, clients, vendors, speakers, exhibitors } from '@/db/schema'
import { eq } from 'drizzle-orm'
import crypto from 'crypto'

const ENTITY_TABLES = {
  client: clients,
  vendor: vendors,
  speaker: speakers,
  exhibitor: exhibitors,
} as const

type ExternalRole = keyof typeof ENTITY_TABLES

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasPermission(session, 'users', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { email, first_name, last_name, role_name, entity_id } = body as {
      email: string
      first_name: string
      last_name: string
      role_name: ExternalRole
      entity_id: number
    }

    if (!email || !first_name || !last_name || !role_name || !entity_id) {
      return NextResponse.json(
        { error: 'email, first_name, last_name, role_name, and entity_id are required' },
        { status: 400 }
      )
    }

    if (!ENTITY_TABLES[role_name]) {
      return NextResponse.json(
        { error: 'role_name must be one of: client, vendor, speaker, exhibitor' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (existing[0]) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    }

    // Find the role
    const roleRecord = await db
      .select({ id: roles.id })
      .from(roles)
      .where(eq(roles.name, role_name))
      .limit(1)

    if (!roleRecord[0]) {
      return NextResponse.json({ error: `Role "${role_name}" not found` }, { status: 404 })
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('base64url')

    // Create pending user with invite token as temporary password hash marker
    // The user will set their password when they accept the invite
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        first_name,
        last_name,
        password_hash: `invite:${inviteToken}`,
        role_id: roleRecord[0].id,
        user_type: 'external',
        is_active: false, // Inactive until invite is accepted
      })
      .returning({
        id: users.id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        role_id: users.role_id,
        user_type: users.user_type,
        created_at: users.created_at,
      })

    // Link entity to user
    const entityTable = ENTITY_TABLES[role_name]
    await db
      .update(entityTable)
      .set({ user_id: newUser.id })
      .where(eq(entityTable.id, entity_id))

    const inviteLink = `/invite/${inviteToken}`

    return NextResponse.json({
      data: newUser,
      invite_token: inviteToken,
      invite_link: inviteLink,
    }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
