'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, Globe, Link2, AtSign, Save, Building2, Star } from 'lucide-react'

type SpeakerProfile = {
  id: number
  name: string
  title: string | null
  organization: string | null
  bio: string | null
  email: string
  phone: string
  website: string | null
  photo_path: string | null
  social_links: Record<string, string>
}

type ExhibitorProfile = {
  id: number
  name: string
  contact_name: string | null
  email: string
  phone: string
  website: string | null
  logo_path: string | null
  industry: string | null
  notes: string | null
}

type VendorProfile = {
  id: number
  name: string
  category: string | null
  contact_name: string | null
  email: string
  phone: string
  website: string | null
  logo_path: string | null
  address: string | null
  rating: number | null
  notes: string | null
}

type ClientProfile = {
  id: number
  name: string
  contact_name: string | null
  email: string
  phone: string
  website: string | null
  logo_path: string | null
  address: string | null
  city: string | null
  country: string | null
  notes: string | null
}

type Props =
  | { role: 'speaker'; profile: SpeakerProfile }
  | { role: 'exhibitor'; profile: ExhibitorProfile }
  | { role: 'vendor'; profile: VendorProfile }
  | { role: 'client'; profile: ClientProfile }

const INPUT_CLASS = 'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'

export function ProfileClient(props: Props) {
  if (props.role === 'speaker') return <SpeakerProfileForm profile={props.profile} />
  if (props.role === 'exhibitor') return <ExhibitorProfileForm profile={props.profile} />
  if (props.role === 'vendor') return <VendorProfileForm profile={props.profile} />
  if (props.role === 'client') return <ClientProfileForm profile={props.profile} />
  return null
}

function SpeakerProfileForm({ profile }: { profile: SpeakerProfile }) {
  const router = useRouter()
  const [bio, setBio] = useState(profile.bio || '')
  const [website, setWebsite] = useState(profile.website || '')
  const [title, setTitle] = useState(profile.title || '')
  const [organization, setOrganization] = useState(profile.organization || '')
  const [linkedin, setLinkedin] = useState(profile.social_links?.linkedin || '')
  const [twitter, setTwitter] = useState(profile.social_links?.twitter || '')
  const [otherLink, setOtherLink] = useState(profile.social_links?.other || '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setLoading(true)
    setError('')
    setSaved(false)

    const socialLinks: Record<string, string> = {}
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

      <Alerts saved={saved} error={error} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Basic Information</h2>
            <div className="space-y-4">
              <ReadOnlyField label="Name" value={profile.name} />
              <FormField label="Title / Role" value={title} onChange={setTitle} placeholder="e.g. Senior Engineer, CEO, Professor" />
              <FormField label="Organization" value={organization} onChange={setOrganization} placeholder="Company or organization name" />
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={5}
                  className={INPUT_CLASS}
                  placeholder="Write a short bio about yourself..."
                />
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Social Links</h2>
            <div className="space-y-4">
              <FormField label="Website" value={website} onChange={setWebsite} placeholder="https://yourwebsite.com" type="url" icon={<Globe className="h-3 w-3" />} />
              <FormField label="LinkedIn" value={linkedin} onChange={setLinkedin} placeholder="https://linkedin.com/in/yourprofile" type="url" icon={<Link2 className="h-3 w-3" />} />
              <FormField label="Twitter / X" value={twitter} onChange={setTwitter} placeholder="https://x.com/yourhandle" type="url" icon={<AtSign className="h-3 w-3" />} />
              <FormField label="Other Link" value={otherLink} onChange={setOtherLink} placeholder="https://..." type="url" />
            </div>
          </div>
        </div>

        <ProfileSidebar
          name={profile.name}
          subtitle={profile.title}
          secondaryText={profile.organization}
          imagePath={profile.photo_path}
          email={profile.email}
          phone={profile.phone}
        />
      </div>
    </>
  )
}

function ExhibitorProfileForm({ profile }: { profile: ExhibitorProfile }) {
  const router = useRouter()
  const [contactName, setContactName] = useState(profile.contact_name || '')
  const [website, setWebsite] = useState(profile.website || '')
  const [industry, setIndustry] = useState(profile.industry || '')
  const [notes, setNotes] = useState(profile.notes || '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setLoading(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/portal/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: contactName || null,
          website: website || null,
          industry: industry || null,
          notes: notes || null,
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
        title="Exhibitor Profile"
        description="Manage your exhibitor information"
        actions={
          <Button onClick={handleSave} loading={loading}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        }
      />

      <Alerts saved={saved} error={error} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Company Information</h2>
            <div className="space-y-4">
              <ReadOnlyField label="Company Name" value={profile.name} />
              <FormField label="Contact Person" value={contactName} onChange={setContactName} placeholder="Primary contact name" />
              <FormField label="Industry" value={industry} onChange={setIndustry} placeholder="e.g. Technology, Healthcare" />
              <FormField label="Website" value={website} onChange={setWebsite} placeholder="https://company.com" type="url" icon={<Globe className="h-3 w-3" />} />
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Description / Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  className={INPUT_CLASS}
                  placeholder="Brief company description..."
                />
              </div>
            </div>
          </div>
        </div>

        <ProfileSidebar
          name={profile.name}
          subtitle={profile.industry}
          secondaryText={profile.contact_name}
          imagePath={profile.logo_path}
          email={profile.email}
          phone={profile.phone}
        />
      </div>
    </>
  )
}

function VendorProfileForm({ profile }: { profile: VendorProfile }) {
  const router = useRouter()
  const [contactName, setContactName] = useState(profile.contact_name || '')
  const [website, setWebsite] = useState(profile.website || '')
  const [category, setCategory] = useState(profile.category || '')
  const [address, setAddress] = useState(profile.address || '')
  const [notes, setNotes] = useState(profile.notes || '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setLoading(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/portal/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: contactName || null,
          website: website || null,
          category: category || null,
          address: address || null,
          notes: notes || null,
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
        title="Vendor Profile"
        description="Manage your vendor information"
        actions={
          <Button onClick={handleSave} loading={loading}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        }
      />

      <Alerts saved={saved} error={error} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Company Information</h2>
            <div className="space-y-4">
              <ReadOnlyField label="Company Name" value={profile.name} />
              <FormField label="Contact Person" value={contactName} onChange={setContactName} placeholder="Primary contact name" />
              <FormField label="Category" value={category} onChange={setCategory} placeholder="e.g. AV Equipment, Catering, Decoration" />
              <FormField label="Website" value={website} onChange={setWebsite} placeholder="https://company.com" type="url" icon={<Globe className="h-3 w-3" />} />
              <FormField label="Address" value={address} onChange={setAddress} placeholder="Business address" />
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  className={INPUT_CLASS}
                  placeholder="Additional information..."
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <ProfileSidebar
            name={profile.name}
            subtitle={profile.category}
            secondaryText={profile.contact_name}
            imagePath={profile.logo_path}
            email={profile.email}
            phone={profile.phone}
          />
          {profile.rating !== null && profile.rating !== undefined && (
            <div className="bg-surface rounded-xl border border-border p-5 mt-4">
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider mb-2">Rating</h3>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i <= (profile.rating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                  />
                ))}
                <span className="text-sm text-text-secondary ml-2">{profile.rating}/5</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function ClientProfileForm({ profile }: { profile: ClientProfile }) {
  const router = useRouter()
  const [contactName, setContactName] = useState(profile.contact_name || '')
  const [website, setWebsite] = useState(profile.website || '')
  const [address, setAddress] = useState(profile.address || '')
  const [city, setCity] = useState(profile.city || '')
  const [country, setCountry] = useState(profile.country || '')
  const [notes, setNotes] = useState(profile.notes || '')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setLoading(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/portal/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: contactName || null,
          website: website || null,
          address: address || null,
          city: city || null,
          country: country || null,
          notes: notes || null,
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
        title="Client Profile"
        description="Manage your organization information"
        actions={
          <Button onClick={handleSave} loading={loading}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        }
      />

      <Alerts saved={saved} error={error} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Organization Information</h2>
            <div className="space-y-4">
              <ReadOnlyField label="Organization Name" value={profile.name} />
              <FormField label="Contact Person" value={contactName} onChange={setContactName} placeholder="Primary contact name" />
              <FormField label="Website" value={website} onChange={setWebsite} placeholder="https://company.com" type="url" icon={<Globe className="h-3 w-3" />} />
              <FormField label="Address" value={address} onChange={setAddress} placeholder="Office address" />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="City" value={city} onChange={setCity} placeholder="City" />
                <FormField label="Country" value={country} onChange={setCountry} placeholder="Country" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  className={INPUT_CLASS}
                  placeholder="Additional information..."
                />
              </div>
            </div>
          </div>
        </div>

        <ProfileSidebar
          name={profile.name}
          subtitle={profile.city ? `${profile.city}${profile.country ? ', ' + profile.country : ''}` : null}
          secondaryText={profile.contact_name}
          imagePath={profile.logo_path}
          email={profile.email}
          phone={profile.phone}
        />
      </div>
    </>
  )
}

// --- Shared Components ---

function Alerts({ saved, error }: { saved: boolean; error: string }) {
  return (
    <>
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
    </>
  )
}

function FormField({
  label, value, onChange, placeholder, type = 'text', icon,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; icon?: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1">
        {icon ? <span className="flex items-center gap-1">{icon} {label}</span> : label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={INPUT_CLASS}
        placeholder={placeholder}
      />
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
      <p className="text-sm text-text-primary bg-surface-secondary rounded-lg px-3 py-2 border border-border">
        {value}
      </p>
      <p className="text-[11px] text-text-tertiary mt-1">Contact admin to change this field</p>
    </div>
  )
}

function ProfileSidebar({
  name, subtitle, secondaryText, imagePath, email, phone,
}: {
  name: string; subtitle: string | null; secondaryText: string | null; imagePath: string | null; email: string; phone: string
}) {
  const initials = name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)

  return (
    <div>
      <div className="bg-surface rounded-xl border border-border p-5">
        <div className="flex flex-col items-center text-center">
          {imagePath ? (
            <img
              src={`/api/files/${imagePath}`}
              alt={name}
              className="h-20 w-20 rounded-full object-cover mb-3"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-semibold mb-3">
              {initials}
            </div>
          )}
          <h3 className="text-sm font-semibold text-text-primary">{name}</h3>
          {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
          {secondaryText && <p className="text-xs text-text-tertiary">{secondaryText}</p>}
        </div>

        <div className="mt-4 pt-4 border-t border-border space-y-2">
          {email && (
            <div className="text-xs">
              <p className="text-text-tertiary">Email</p>
              <p className="text-text-primary">{email}</p>
            </div>
          )}
          {phone && (
            <div className="text-xs">
              <p className="text-text-tertiary">Phone</p>
              <p className="text-text-primary">{phone}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
