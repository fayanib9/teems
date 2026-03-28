'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type InviteData = {
  valid: boolean
  email: string
  first_name: string
  last_name: string
  role?: string
}

export default function InviteAcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [invalidToken, setInvalidToken] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/portal/invite/accept?token=${token}`)
        if (res.ok) {
          const data = await res.json()
          setInvite(data)
          setFirstName(data.first_name || '')
          setLastName(data.last_name || '')
        } else {
          setInvalidToken(true)
        }
      } catch {
        setInvalidToken(true)
      } finally {
        setLoading(false)
      }
    }
    validate()
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/portal/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          first_name: firstName,
          last_name: lastName,
        }),
      })

      if (res.ok) {
        router.push('/portal')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to accept invitation')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-tertiary rounded w-2/3 mx-auto" />
          <div className="h-4 bg-surface-tertiary rounded w-1/2 mx-auto" />
          <div className="h-10 bg-surface-tertiary rounded" />
          <div className="h-10 bg-surface-tertiary rounded" />
        </div>
      </div>
    )
  }

  if (invalidToken) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6 shadow-sm text-center">
        <h2 className="text-lg font-semibold text-text-primary mb-2">Invalid Invitation</h2>
        <p className="text-sm text-text-secondary mb-4">
          This invitation link is invalid or has already been used.
        </p>
        <Button onClick={() => router.push('/login')} variant="outline">
          Go to Login
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-text-primary">Accept Invitation</h2>
        <p className="text-sm text-text-secondary mt-1">Complete your profile to get started</p>
        {invite?.role && (
          <Badge color="purple" className="mt-2">
            {invite.role} account
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-xs text-text-tertiary text-center mb-2">
          Signing up as <span className="text-text-primary font-medium">{invite?.email}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="first_name"
            label="First Name"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            required
          />
          <Input
            id="last_name"
            label="Last Name"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            required
          />
        </div>

        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <Input
          id="confirm_password"
          label="Confirm Password"
          type="password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <Button type="submit" className="w-full" loading={submitting}>
          Complete Registration
        </Button>
      </form>
    </div>
  )
}
