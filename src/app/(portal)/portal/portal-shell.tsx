'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  CalendarDays, FileText, CheckSquare, Truck, Mic, Presentation, MapPin,
  LogOut, Menu, X, Bell, Home, User,
} from 'lucide-react'
import { ToastProvider } from '@/components/ui/toast'
import type { SessionUser } from '@/lib/auth'

type NavItem = { label: string; href: string; icon: typeof Home }

const PORTAL_NAV: Record<string, NavItem[]> = {
  client: [
    { label: 'Overview', href: '/portal', icon: Home },
    { label: 'My Events', href: '/portal/events', icon: CalendarDays },
    { label: 'Documents', href: '/portal/documents', icon: FileText },
    { label: 'Approvals', href: '/portal/approvals', icon: CheckSquare },
  ],
  vendor: [
    { label: 'Overview', href: '/portal', icon: Home },
    { label: 'My Events', href: '/portal/events', icon: CalendarDays },
    { label: 'Documents', href: '/portal/documents', icon: FileText },
  ],
  speaker: [
    { label: 'Overview', href: '/portal', icon: Home },
    { label: 'My Sessions', href: '/portal/sessions', icon: Mic },
    { label: 'Documents', href: '/portal/documents', icon: FileText },
    { label: 'Profile', href: '/portal/profile', icon: User },
  ],
  exhibitor: [
    { label: 'Overview', href: '/portal', icon: Home },
    { label: 'My Booth', href: '/portal/booth', icon: MapPin },
    { label: 'Documents', href: '/portal/documents', icon: FileText },
  ],
}

const ROLE_LABELS: Record<string, string> = {
  client: 'Client Portal',
  vendor: 'Vendor Portal',
  speaker: 'Speaker Portal',
  exhibitor: 'Exhibitor Portal',
}

export function PortalShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = PORTAL_NAV[user.role_name] || PORTAL_NAV.client
  const portalLabel = ROLE_LABELS[user.role_name] || 'Portal'

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface-secondary">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-surface border-r border-border flex flex-col transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border shrink-0">
            <Image src="/logo.svg" alt="TEEMS" width={32} height={32} className="rounded-lg" />
            <div>
              <p className="text-sm font-semibold text-text-primary leading-tight">TEEMS</p>
              <p className="text-[10px] text-primary-500 font-medium">{portalLabel}</p>
            </div>
            <button onClick={() => setMobileOpen(false)} className="lg:hidden ml-auto text-text-tertiary">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface-tertiary hover:text-text-primary transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-border px-3 py-3">
            <div className="flex items-center gap-2.5 px-2">
              <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                {user.first_name.charAt(0)}{user.last_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{user.first_name} {user.last_name}</p>
                <p className="text-[11px] text-text-tertiary capitalize">{user.role_name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2 flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="lg:ml-60">
          <header className="sticky top-0 z-30 h-14 bg-surface/80 backdrop-blur-sm border-b border-border-light flex items-center justify-between px-4 lg:px-6">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-text-secondary hover:text-text-primary">
              <Menu className="h-5 w-5" />
            </button>
            <div />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                {user.first_name.charAt(0)}{user.last_name.charAt(0)}
              </div>
            </div>
          </header>
          <main className="p-4 lg:p-6 max-w-[1200px]">{children}</main>
        </div>
      </div>
    </ToastProvider>
  )
}
