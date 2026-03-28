import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, invite_tokens } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { sendEmail, passwordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Always return success to prevent email enumeration
    const user = await db
      .select({ id: users.id, email: users.email, is_active: users.is_active })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (user[0] && user[0].is_active) {
      const token = randomUUID()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await db.insert(invite_tokens).values({
        email: user[0].email,
        token: `reset:${token}`,
        expires_at: expiresAt,
      })

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
      const resetUrl = `${baseUrl}/reset-password/${token}`

      const emailContent = passwordResetEmail(resetUrl)
      await sendEmail({
        to: user[0].email,
        ...emailContent,
      })
    }

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
