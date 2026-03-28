'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error('Failed to send reset email')
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.svg" alt="TEEMS" width={48} height={48} className="mx-auto mb-4 rounded-xl" />
          <h1 className="text-2xl font-bold text-text-primary">Reset Password</h1>
          <p className="text-sm text-text-secondary mt-1">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="h-12 w-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-2">Check your email</h2>
              <p className="text-sm text-text-secondary mb-4">
                If an account with that email exists, we&apos;ve sent a password reset link.
              </p>
              <Link href="/login" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-text-primary">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full h-9 rounded-md border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {error && <p className="text-sm text-red-500" role="alert">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 rounded-md bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <p className="text-center text-sm text-text-secondary">
                <Link href="/login" className="text-primary-500 hover:text-primary-600">Back to login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
