'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { Save, Settings, Mail, Globe } from 'lucide-react'

type Props = {
  settings: Record<string, string>
  canEdit: boolean
}

const TIMEZONES = [
  'Asia/Riyadh',
  'Asia/Dubai',
  'Asia/Bahrain',
  'Asia/Qatar',
  'Europe/London',
  'America/New_York',
  'America/Chicago',
]

const CURRENCIES = ['SAR', 'AED', 'USD', 'EUR', 'GBP', 'BHD', 'QAR']

export function SettingsClient({ settings: initial, canEdit }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ type: 'success', message: 'Settings saved' })
      router.refresh()
    } catch {
      toast({ type: 'error', message: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="System configuration"
        actions={canEdit ? <Button onClick={handleSave} loading={saving}><Save className="h-4 w-4" /> Save Changes</Button> : undefined}
      />

      <div className="space-y-6 max-w-2xl">
        {/* General */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4 text-text-tertiary" />
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">General</h2>
          </div>
          <div className="space-y-4">
            <Input
              label="Organization Name"
              value={form.organization_name}
              onChange={e => update('organization_name', e.target.value)}
              disabled={!canEdit}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">Timezone</label>
                <select
                  value={form.timezone}
                  onChange={e => update('timezone', e.target.value)}
                  disabled={!canEdit}
                  className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none disabled:opacity-50"
                >
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">Currency</label>
                <select
                  value={form.currency}
                  onChange={e => update('currency', e.target.value)}
                  disabled={!canEdit}
                  className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none disabled:opacity-50"
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">Language</label>
              <select
                value={form.language}
                onChange={e => update('language', e.target.value)}
                disabled={!canEdit}
                className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none disabled:opacity-50"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-4 w-4 text-text-tertiary" />
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Email (SMTP)</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="SMTP Host"
                value={form.smtp_host}
                onChange={e => update('smtp_host', e.target.value)}
                placeholder="smtp.example.com"
                disabled={!canEdit}
              />
              <Input
                label="SMTP Port"
                value={form.smtp_port}
                onChange={e => update('smtp_port', e.target.value)}
                placeholder="587"
                disabled={!canEdit}
              />
            </div>
            <Input
              label="From Address"
              value={form.smtp_from}
              onChange={e => update('smtp_from', e.target.value)}
              placeholder="noreply@example.com"
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* System Info */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4 text-text-tertiary" />
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">System Info</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-text-secondary">Version</span>
              <span className="text-text-primary font-medium">1.0.0</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-text-secondary">Database</span>
              <span className="text-text-primary">PostgreSQL</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-text-secondary">Framework</span>
              <span className="text-text-primary">Next.js 16</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
