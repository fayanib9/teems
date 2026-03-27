'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Bell, Search, LogOut, User, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SessionUser } from '@/lib/auth'
import type { BreadcrumbItem } from '@/types'

type HeaderProps = {
  user: SessionUser
  onMenuClick: () => void
  breadcrumbs?: BreadcrumbItem[]
}

export function Header({ user, onMenuClick, breadcrumbs }: HeaderProps) {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-30 h-14 bg-surface/80 backdrop-blur-sm border-b border-border-light flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-text-secondary hover:text-text-primary">
          <Menu className="h-5 w-5" />
        </button>

        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />}
                {crumb.href ? (
                  <a href={crumb.href} className="text-text-secondary hover:text-text-primary">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-text-primary font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="flex items-center gap-2 h-8 px-3 rounded-lg bg-surface-tertiary text-text-tertiary text-sm hover:bg-gray-200 transition-colors">
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden md:inline text-[10px] bg-surface border border-border rounded px-1.5 py-0.5 ml-2">⌘K</kbd>
        </button>

        {/* Notifications */}
        <button className="relative h-9 w-9 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors">
          <Bell className="h-4.5 w-4.5" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 h-9 pl-2 pr-3 rounded-lg hover:bg-surface-tertiary transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-primary-100 text-primary-700 font-medium text-xs flex items-center justify-center">
              {user.first_name.charAt(0)}{user.last_name.charAt(0)}
            </div>
            <span className="hidden md:block text-sm text-text-primary">
              {user.first_name}
            </span>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-surface rounded-lg shadow-lg border border-border py-1 z-50">
                <button
                  onClick={() => { setShowUserMenu(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:bg-surface-tertiary"
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <hr className="my-1 border-border-light" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
