import { getSession, hasPermission } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { settings } from '@/db/schema'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) return null
  if (!hasPermission(session, 'settings', 'view')) redirect('/dashboard')

  const rows = await db.select().from(settings)
  const data = Object.fromEntries(rows.map(r => [r.key, r.value]))

  // Ensure default values
  const config = {
    organization_name: data.organization_name || 'Toada Consulting',
    timezone: data.timezone || 'Asia/Riyadh',
    currency: data.currency || 'SAR',
    language: data.language || 'en',
    date_format: data.date_format || 'MMM dd, yyyy',
    items_per_page: data.items_per_page || '25',
    notify_task_assigned: data.notify_task_assigned || 'true',
    notify_approval_needed: data.notify_approval_needed || 'true',
    notify_deadline_approaching: data.notify_deadline_approaching || 'true',
    smtp_host: data.smtp_host || '',
    smtp_port: data.smtp_port || '587',
    smtp_from: data.smtp_from || '',
  }

  return (
    <SettingsClient
      settings={config}
      canEdit={hasPermission(session, 'settings', 'edit')}
    />
  )
}
