'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Bell, LogOut, User, ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SessionUser } from '@/lib/auth'
import type { BreadcrumbItem } from '@/types'

type HeaderProps = {
  user: SessionUser
  onMenuClick: () => void
  breadcrumbs?: BreadcrumbItem[]
}

type Notification = {
  id: number
  title: string
  message: string
  type: string
  link: string | null
  is_read: boolean
  created_at: string | null
}

export function Header({ user, onMenuClick, breadcrumbs }: HeaderProps) {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifs(data.data || [])
      setUnreadCount(data.unread_count || 0)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [fetchNotifs])

  async function markAllRead() {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      })
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch { /* silent */ }
  }

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
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative h-9 w-9 flex items-center justify-center rounded-lg text-text-secondary hover:bg-surface-tertiary transition-colors"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 top-full mt-1 w-80 bg-surface rounded-xl shadow-lg border border-border z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                  <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1 cursor-pointer">
                      <Check className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <p className="text-sm text-text-tertiary text-center py-8">No notifications</p>
                  ) : (
                    notifs.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (n.link) { router.push(n.link); setShowNotifs(false) }
                        }}
                        className={cn(
                          'px-4 py-3 border-b border-border-light last:border-0 hover:bg-surface-secondary transition-colors',
                          n.link && 'cursor-pointer',
                          !n.is_read && 'bg-primary-50/50'
                        )}
                      >
                        <p className="text-sm text-text-primary">{n.title}</p>
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{n.message}</p>
                        {n.created_at && (
                          <p className="text-[11px] text-text-tertiary mt-1">
                            {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

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
