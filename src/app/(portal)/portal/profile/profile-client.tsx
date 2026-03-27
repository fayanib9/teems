'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { User, Globe, Link2, AtSign, Save } from 'lucide-react'

type Profile = {
  id: number
  name: string
  title: string | null
  organization: string | null
  bio: string | null
  email: string | null
  phone: string | null
  website: string | null
  social_links: string | null
  photo_path: string | null
}

type Props = {
  profile: Profile
}

type SocialLinks = {
  linkedin?: string
  twitter?: string
  other?: string
}

export function ProfileClient({ profile }: Props) {
  const router = useRouter()

  // Parse social_links JSON
  let initialSocial: SocialLinks = {}
  try {
    if (profile.social_links) {
      initialSocial = JSON.parse(profile.social_links)
    }
  } catch {}

  const [bio, setBio] = useState(profile.bio || '')
  const [website, setWebsite] = useState(profile.website || '')
  const [title, setTitle] = useState(profile.title || '')
  const [organization, setOrganization] = useState(profile.organization || '')
  const [linkedin, setLinkedin] = useState(initialSocial.linkedin || '')
  const [twitter, setTwitter] = useState(initialSocial.twitter || '')
  const [otherLink, setOtherLink] = useState(initialSocial.other || '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setLoading(true)
    setError('')
    setSaved(false)

    const socialLinks: SocialLinks = {}
    if (linkedin) socialLinks.linkedin = linkedin
    if (twitter) socialLinks.twitter = twitter
    if (otherLink) socialLinks.other = otherLink

    try {
      const res = await fetch('/api/portal/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          website: website || null,
          title: title || null,
          organization: organization || null,
          social_links: Object.keys(socialLinks).length > 0 ? JSON.stringify(socialLinks) : null,
        }),
      })

      if (res.ok) {
        setSaved(true)
        router.refresh()
        setTimeout(() => setSaved(false), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save profile')
      }
    } catch {
      setError('Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Speaker Profile"
        description="Manage your public speaker profile"
        actions={
          <Button onClick={handleSave} loading={loading}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        }
      />

      {saved && (
        <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Profile saved successfully.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Name</label>
                <p className="text-sm text-text-primary bg-surface-secondary rounded-lg px-3 py-2 border border-border">
                  {profile.name}
                </p>
                <p className="text-[11px] text-text-tertiary mt-1">Contact admin to change your name</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Title / Role</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g. Senior Engineer, CEO, Professor"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Organization</label>
                <input
                  type="text"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Company or organization name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Write a short bio about yourself..."
                />
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Social Links</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> Website</span>
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  <span className="flex items-center gap-1"><Link2 className="h-3 w-3" /> LinkedIn</span>
                </label>
                <input
                  type="url"
                  value={linkedin}
                  onChange={e => setLinkedin(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  <span className="flex items-center gap-1"><AtSign className="h-3 w-3" /> Twitter / X</span>
                </label>
                <input
                  type="url"
                  value={twitter}
                  onChange={e => setTwitter(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://x.com/yourhandle"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Other Link</label>
                <input
                  type="url"
                  value={otherLink}
                  onChange={e => setOtherLink(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex flex-col items-center text-center">
              {profile.photo_path ? (
                <img
                  src={`/api/files/${profile.photo_path}`}
                  alt={profile.name}
                  className="h-20 w-20 rounded-full object-cover mb-3"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-semibold mb-3">
                  {profile.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                </div>
              )}
              <h3 className="text-sm font-semibold text-text-primary">{profile.name}</h3>
              {profile.title && <p className="text-xs text-text-secondary mt-0.5">{profile.title}</p>}
              {profile.organization && <p className="text-xs text-text-tertiary">{profile.organization}</p>}
            </div>

            <div className="mt-4 pt-4 border-t border-border space-y-2">
              {profile.email && (
                <div className="text-xs">
                  <p className="text-text-tertiary">Email</p>
                  <p className="text-text-primary">{profile.email}</p>
                </div>
              )}
              {profile.phone && (
                <div className="text-xs">
                  <p className="text-text-tertiary">Phone</p>
                  <p className="text-text-primary">{profile.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
