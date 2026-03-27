import { getSession } from '@/lib/auth'
import { db } from '@/db'
import { speakers } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { PageHeader } from '@/components/layout/page-header'
import { ProfileClient } from './profile-client'

export default async function PortalProfilePage() {
  const session = await getSession()
  if (!session) return null

  if (session.role_name !== 'speaker') {
    return (
      <>
        <PageHeader title="Profile" description="This section is not available for your role" />
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-text-secondary">Profile editing is only available for speaker accounts.</p>
        </div>
      </>
    )
  }

  const [speaker] = await db.select().from(speakers).where(eq(speakers.user_id, session.id)).limit(1)
  if (!speaker) {
    return (
      <>
        <PageHeader title="Profile" />
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <p className="text-sm text-text-secondary">No speaker profile linked to your account.</p>
        </div>
      </>
    )
  }

  const profileData = {
    id: speaker.id,
    name: speaker.name,
    title: speaker.title,
    organization: speaker.organization,
    bio: speaker.bio,
    email: speaker.email,
    phone: speaker.phone,
    website: speaker.website,
    social_links: speaker.social_links,
    photo_path: speaker.photo_path,
  }

  return <ProfileClient profile={profileData} />
}
