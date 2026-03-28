'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, CalendarDays, CheckSquare, Calendar, Clock,
  Building2, Store, Mic, Presentation, Users,
  FileText, ClipboardCheck, BarChart3,
  UserCog, Settings, History, X,
  Wand2, Calculator, GitCompare, Scale, ShieldAlert,
  LayoutTemplate, Workflow, UserCheck,
  LayoutGrid, Users2, BookOpen,
} from 'lucide-react'
import type { SessionUser } from '@/lib/auth'

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, CalendarDays, CheckSquare, Calendar, Clock,
  Building2, Store, Mic, Presentation, Users,
  FileText, ClipboardCheck, BarChart3,
  UserCog, Settings, History,
  Wand2, Calculator, GitCompare, Scale, ShieldAlert,
  LayoutTemplate, Workflow, UserCheck,
  LayoutGrid, Users2, BookOpen,
}

type SidebarProps = {
  user: SessionUser
  open: boolean
  onClose: () => void
}

const navSections = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
      { label: 'Portfolio', href: '/portfolio', icon: 'LayoutGrid', permission: 'events:view' },
      { label: 'Events', href: '/events', icon: 'CalendarDays', permission: 'events:view' },
      { label: 'Tasks', href: '/tasks', icon: 'CheckSquare', permission: 'tasks:view' },
      { label: 'Timesheets', href: '/timesheets', icon: 'Clock' },
      { label: 'Calendar', href: '/calendar', icon: 'Calendar' },
    ],
  },
  {
    title: 'Directory',
    items: [
      { label: 'Clients', href: '/clients', icon: 'Building2', permission: 'clients:view' },
      { label: 'Vendors', href: '/vendors', icon: 'Store', permission: 'vendors:view' },
      { label: 'Speakers', href: '/speakers', icon: 'Mic', permission: 'speakers:view' },
      { label: 'Exhibitors', href: '/exhibitors', icon: 'Presentation', permission: 'exhibitors:view' },
      { label: 'Teams', href: '/teams', icon: 'Users', permission: 'teams:view' },
    ],
  },
  {
    title: 'Workflow',
    items: [
      { label: 'Documents', href: '/documents', icon: 'FileText', permission: 'documents:view' },
      { label: 'Approvals', href: '/approvals', icon: 'ClipboardCheck', permission: 'approvals:view' },
      { label: 'Resources', href: '/resources', icon: 'Users2', permission: 'teams:view' },
      { label: 'Lessons', href: '/lessons', icon: 'BookOpen', permission: 'events:view' },
      { label: 'Reports', href: '/reports', icon: 'BarChart3', permission: 'reports:view' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { label: 'Plan Generator', href: '/tools/planner', icon: 'Wand2', permission: 'tools:view' },
      { label: 'Budget Calculator', href: '/tools/budget', icon: 'Calculator', permission: 'tools:view' },
      { label: 'Vendor Matcher', href: '/tools/vendors', icon: 'Scale', permission: 'tools:view' },
      { label: 'Risk Assessor', href: '/tools/risks', icon: 'ShieldAlert', permission: 'tools:view' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Users', href: '/users', icon: 'UserCog', permission: 'users:view' },
      { label: 'Activity Log', href: '/activity', icon: 'History', permission: 'settings:view' },
      { label: 'Settings', href: '/settings', icon: 'Settings', permission: 'settings:view' },
      { label: 'Plan Templates', href: '/admin/plan-templates', icon: 'LayoutTemplate', permission: 'settings:view' },
      { label: 'Plan Rules', href: '/admin/plan-rules', icon: 'Workflow', permission: 'settings:view' },
      { label: 'Plan Roles', href: '/admin/plan-roles', icon: 'UserCheck', permission: 'settings:view' },
    ],
  },
]

export function Sidebar({ user, open, onClose }: SidebarProps) {
  const pathname = usePathname()

  function canSee(permission?: string) {
    if (!permission) return true
    if (user.role_name === 'super_admin' || user.role_name === 'admin') return true
    return user.permissions.includes(permission)
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-60 bg-surface border-r border-border flex flex-col transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border-light">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="TEEMS" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-bold text-text-primary">TEEMS</span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-text-tertiary hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav data-tour="sidebar" className="flex-1 overflow-y-auto py-3 px-3">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => canSee(item.permission))
            if (visibleItems.length === 0) return null

            return (
              <div key={section.title} className="mb-4">
                <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider px-3 mb-1">
                  {section.title}
                </p>
                {visibleItems.map((item) => {
                  const Icon = iconMap[item.icon]
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      {...(item.label === 'Events' ? { 'data-tour': 'events' } : {})}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
                      )}
                    >
                      {Icon && <Icon className="h-4.5 w-4.5 shrink-0" />}
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* User */}
        <div className="border-t border-border-light p-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 font-medium text-xs flex items-center justify-center">
              {user.first_name.charAt(0)}{user.last_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-text-tertiary truncate capitalize">
                {user.role_name.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
