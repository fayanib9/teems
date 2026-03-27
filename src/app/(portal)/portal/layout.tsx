import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { PortalShell } from './portal-shell'

const EXTERNAL_ROLES = ['client', 'vendor', 'speaker', 'exhibitor']

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!EXTERNAL_ROLES.includes(session.role_name)) redirect('/dashboard')

  return <PortalShell user={session}>{children}</PortalShell>
}
