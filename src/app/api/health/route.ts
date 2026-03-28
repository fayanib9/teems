import { NextResponse } from 'next/server'
import { db } from '@/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  const checks: Record<string, string> = {}

  // Database connectivity check
  try {
    await db.execute(sql`SELECT 1`)
    checks.database = 'ok'
  } catch {
    checks.database = 'error'
  }

  const allOk = Object.values(checks).every((v) => v === 'ok')

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      uptime: process.uptime(),
    },
    { status: allOk ? 200 : 503 }
  )
}
