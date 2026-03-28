'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  CalendarDays, FileText, CheckSquare, Mic, MapPin,
  LogOut, Menu, X, Home, User, Plane, Bell,
  MessageSquare, GitBranch, ShoppingCart, Info, Star,
} from 'lucide-react'
import { ToastProvider } from '@/components/ui/toast'
import type { SessionUser } from '@/lib/auth'

type NavItem = { label: string; href: string; icon: typeof Home; badgeKey?: string }

const PORTAL_NAV: Record<string, NavItem[]> = {
  client: [
    { label: 'Dashboard', href: '/portal', icon: Home },
    { label: 'My Events', href: '/portal/events', icon: CalendarDays },
    { label: 'Documents', href: '/portal/documents', icon: FileText },
    { label: 'Approvals', href: '/portal/approvals', icon: CheckSquare, badgeKey: 'approvals' },
    { label: 'Messages', href: '/portal/messages', icon: MessageSquare, badgeKey: 'messages' },
    { label: 'Change Requests', href: '/portal/change-requests', icon: GitBranch },
    { label: 'Feedback', href: '/portal/feedback', icon: Star },
    { label: 'Profile', href: '/portal/profile', icon: User },
  ],
  vendor: [
    { label: 'Dashboard', href: '/portal', icon: Home },
    { label: 'My Events', href: '/portal/events', icon: CalendarDays },
    { label: 'Documents', href: '/portal/documents', icon: FileText },
    { label: 'Messages', href: '/portal/messages', icon: MessageSquare, badgeKey: 'messages' },
    { label: 'Feedback', href: '/portal/feedback', icon: Star },
    { label: 'Profile', href: '/portal/profile', icon: User },
  ],
  speaker: [
    { label: 'Dashboard', href: '/portal', icon: Home },
    { label: 'My Sessions', href: '/portal/sessions', icon: Mic },
    { label: 'Travel & Logistics', href: '/portal/travel', icon: Plane },
    { label: 'Documents', href: '/portal/documents', icon: FileText },
    { label: 'Messages', href: '/portal/messages', icon: MessageSquare, badgeKey: 'messages' },
    { label: 'Event Info', href: '/portal/event-info', icon: Info },
    { label: 'Feedback', href: '/portal/feedback', icon: Star },
    { label: 'Profile', href: '/portal/profile', icon: User },
  ],
  exhibitor: [
    { label: 'Dashboard', href: '/portal', icon: Home },
    { label: 'My Booth', href: '/portal/booth', icon: MapPin },
    { label: 'Services', href: '/portal/services', icon: ShoppingCart },
    { label: 'Documents', href: '/portal/documents', icon: FileText },
    { label: 'Messages', href: '/portal/messages', icon: MessageSquare, badgeKey: 'messages' },
    { label: 'Event Info', href: '/portal/event-info', icon: Info },
    { label: 'Feedback', href: '/portal/feedback', icon: Star },
    { label: 'Profile', href: '/portal/profile', icon: User },
  ],
}

const ROLE_LABELS: Record<string, string> = {
  client: 'Client Portal',
  vendor: 'Vendor Portal',
  speaker: 'Speaker Portal',
  exhibitor: 'Exhibitor Portal',
}

type BadgeCounts = {
  approvals?: number
  messages?: number
}

export function PortalShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({})

  const navItems = PORTAL_NAV[user.role_name] || PORTAL_NAV.client
  const portalLabel = ROLE_LABELS[user.role_name] || 'Portal'

  // Fetch notification counts
  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch('/api/portal/overview')
        if (res.ok) {
          const data = await res.json()
          setBadgeCounts({
            approvals: data.pending_approvals_count || 0,
            messages: data.unread_messages_count || 0,
          })
        }
      } catch {}
    }
    fetchCounts()
  }, [pathname])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  function isActive(href: string) {
    if (href === '/portal') return pathname === '/portal'
    return pathname.startsWith(href)
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
              const active = isActive(item.href)
              const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey as keyof BadgeCounts] : undefined
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  {badgeCount && badgeCount > 0 ? (
                    <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold px-1.5">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  ) : null}
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
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary hidden sm:block">
                {user.first_name} {user.last_name}
              </span>
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
