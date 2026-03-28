import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { speakers, vendors, exhibitors, clients, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { PageHeader } from '@/components/layout/page-header'
import { ProfileClient } from './profile-client'

export default async function PortalProfilePage() {
  const session = await getSession()
  if (!session) return null

  const role = session.role_name

  // Get the user record for shared fields
  const [userRecord] = await db
    .select({ email: users.email, phone: users.phone })
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1)

  if (role === 'speaker') {
    const [speaker] = await db.select().from(speakers).where(eq(speakers.user_id, session.id)).limit(1)
    if (!speaker) return <NoProfile />

    let socialLinks: Record<string, string> = {}
    try {
      if (speaker.social_links) socialLinks = JSON.parse(speaker.social_links)
    } catch {}

    return (
      <ProfileClient
        role="speaker"
        profile={{
          id: speaker.id,
          name: speaker.name,
          title: speaker.title,
          organization: speaker.organization,
          bio: speaker.bio,
          email: speaker.email || userRecord?.email || '',
          phone: speaker.phone || userRecord?.phone || '',
          website: speaker.website,
          photo_path: speaker.photo_path,
          social_links: socialLinks,
        }}
      />
    )
  }

  if (role === 'exhibitor') {
    const [exhibitor] = await db.select().from(exhibitors).where(eq(exhibitors.user_id, session.id)).limit(1)
    if (!exhibitor) return <NoProfile />

    return (
      <ProfileClient
        role="exhibitor"
        profile={{
          id: exhibitor.id,
          name: exhibitor.name,
          contact_name: exhibitor.contact_name,
          email: exhibitor.email || userRecord?.email || '',
          phone: exhibitor.phone || userRecord?.phone || '',
          website: exhibitor.website,
          logo_path: exhibitor.logo_path,
          industry: exhibitor.industry,
          notes: exhibitor.notes,
        }}
      />
    )
  }

  if (role === 'vendor') {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.user_id, session.id)).limit(1)
    if (!vendor) return <NoProfile />

    return (
      <ProfileClient
        role="vendor"
        profile={{
          id: vendor.id,
          name: vendor.name,
          category: vendor.category,
          contact_name: vendor.contact_name,
          email: vendor.email || userRecord?.email || '',
          phone: vendor.phone || userRecord?.phone || '',
          website: vendor.website,
          logo_path: vendor.logo_path,
          address: vendor.address,
          rating: vendor.rating,
          notes: vendor.notes,
        }}
      />
    )
  }

  if (role === 'client') {
    const [client] = await db.select().from(clients).where(eq(clients.user_id, session.id)).limit(1)
    if (!client) return <NoProfile />

    return (
      <ProfileClient
        role="client"
        profile={{
          id: client.id,
          name: client.name,
          contact_name: client.contact_name,
          email: client.email || userRecord?.email || '',
          phone: client.phone || userRecord?.phone || '',
          website: client.website,
          logo_path: client.logo_path,
          address: client.address,
          city: client.city,
          country: client.country,
          notes: client.notes,
        }}
      />
    )
  }

  return <NoProfile />
}

function NoProfile() {
  return (
    <>
      <PageHeader title="Profile" />
      <div className="bg-surface rounded-xl border border-border p-12 text-center">
        <p className="text-sm text-text-secondary">No profile linked to your account. Please contact your administrator.</p>
      </div>
    </>
  )
}
