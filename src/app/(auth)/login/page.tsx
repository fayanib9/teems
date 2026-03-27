'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      const externalRoles = ['client', 'vendor', 'speaker', 'exhibitor']
      if (data.user?.role && externalRoles.includes(data.user.role)) {
        router.push('/portal')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-6 shadow-sm">
      <div className="flex flex-col items-center mb-6">
        <img src="/logo.svg" alt="TEEMS" width={48} height={48} className="rounded-xl mb-3" />
        <h2 className="text-lg font-semibold text-text-primary">Welcome to TEEMS</h2>
        <p className="text-sm text-text-secondary">Sign in to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="you@toada.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>
    </div>
  )
}
