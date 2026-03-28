import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, invite_tokens } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const resetToken = await db
      .select()
      .from(invite_tokens)
      .where(
        and(
          eq(invite_tokens.token, `reset:${token}`),
          eq(invite_tokens.is_used, false)
        )
      )
      .limit(1)

    if (!resetToken[0]) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    if (new Date() > resetToken[0].expires_at) {
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    await db
      .update(users)
      .set({ password_hash: passwordHash, updated_at: new Date() })
      .where(eq(users.email, resetToken[0].email))

    await db
      .update(invite_tokens)
      .set({ is_used: true, accepted_at: new Date() })
      .where(eq(invite_tokens.id, resetToken[0].id))

    return NextResponse.json({ message: 'Password reset successful' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
