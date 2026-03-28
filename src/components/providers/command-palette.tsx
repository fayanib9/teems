'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, CalendarDays, CheckSquare, Building2, Store, Mic, Presentation,
  Users, FileText, ClipboardCheck, BarChart3, Settings, Wand2, Calculator,
  Scale, ShieldAlert, Plus, Moon, Sun, Monitor,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from './theme-provider'

type CommandItem = {
  id: string
  label: string
  icon: React.ElementType
  href?: string
  action?: () => void
  section: string
  keywords?: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { setTheme } = useTheme()

  const commands: CommandItem[] = [
    // Navigation
    { id: 'dashboard', label: 'Go to Dashboard', icon: CalendarDays, href: '/dashboard', section: 'Navigate', keywords: 'home' },
    { id: 'events', label: 'Go to Events', icon: CalendarDays, href: '/events', section: 'Navigate' },
    { id: 'tasks', label: 'Go to Tasks', icon: CheckSquare, href: '/tasks', section: 'Navigate' },
    { id: 'clients', label: 'Go to Clients', icon: Building2, href: '/clients', section: 'Navigate' },
    { id: 'vendors', label: 'Go to Vendors', icon: Store, href: '/vendors', section: 'Navigate' },
    { id: 'speakers', label: 'Go to Speakers', icon: Mic, href: '/speakers', section: 'Navigate' },
    { id: 'exhibitors', label: 'Go to Exhibitors', icon: Presentation, href: '/exhibitors', section: 'Navigate' },
    { id: 'teams', label: 'Go to Teams', icon: Users, href: '/teams', section: 'Navigate' },
    { id: 'documents', label: 'Go to Documents', icon: FileText, href: '/documents', section: 'Navigate' },
    { id: 'approvals', label: 'Go to Approvals', icon: ClipboardCheck, href: '/approvals', section: 'Navigate' },
    { id: 'reports', label: 'Go to Reports', icon: BarChart3, href: '/reports', section: 'Navigate' },
    { id: 'settings', label: 'Go to Settings', icon: Settings, href: '/settings', section: 'Navigate' },
    // Actions
    { id: 'new-event', label: 'Create New Event', icon: Plus, href: '/events/new', section: 'Actions', keywords: 'add create event' },
    { id: 'new-plan', label: 'Generate Plan', icon: Wand2, href: '/tools/planner/new', section: 'Actions', keywords: 'plan generator' },
    { id: 'new-budget', label: 'Calculate Budget', icon: Calculator, href: '/tools/budget/new', section: 'Actions', keywords: 'budget calculator' },
    { id: 'new-vendor-match', label: 'Match Vendors', icon: Scale, href: '/tools/vendors/new', section: 'Actions', keywords: 'vendor match' },
    { id: 'new-risk', label: 'Assess Risks', icon: ShieldAlert, href: '/tools/risks/new', section: 'Actions', keywords: 'risk assessment' },
    // Theme
    { id: 'theme-light', label: 'Switch to Light Mode', icon: Sun, action: () => setTheme('light'), section: 'Preferences' },
    { id: 'theme-dark', label: 'Switch to Dark Mode', icon: Moon, action: () => setTheme('dark'), section: 'Preferences' },
    { id: 'theme-system', label: 'Use System Theme', icon: Monitor, action: () => setTheme('system'), section: 'Preferences' },
  ]

  const filtered = query
    ? commands.filter(c => {
        const searchText = `${c.label} ${c.keywords || ''} ${c.section}`.toLowerCase()
        return query.toLowerCase().split(' ').every(q => searchText.includes(q))
      })
    : commands

  const sections = Array.from(new Set(filtered.map(c => c.section)))

  const execute = useCallback((item: CommandItem) => {
    setOpen(false)
    setQuery('')
    if (item.action) item.action()
    else if (item.href) router.push(item.href)
  }, [router])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
        setQuery('')
        setSelectedIndex(0)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault()
      execute(filtered[selectedIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg bg-surface rounded-xl shadow-2xl border border-border overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-5 w-5 text-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-tertiary"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary bg-surface-tertiary rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-text-tertiary text-center py-6">No results found</p>
          ) : (
            sections.map(section => {
              const items = filtered.filter(c => c.section === section)
              return (
                <div key={section}>
                  <p className="px-4 py-1.5 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                    {section}
                  </p>
                  {items.map(item => {
                    const globalIdx = filtered.indexOf(item)
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => execute(item)}
                        className={cn(
                          'flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors',
                          globalIdx === selectedIndex
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-text-primary hover:bg-surface-secondary'
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border text-[11px] text-text-tertiary">
          <span>Navigate with <kbd className="px-1 bg-surface-tertiary rounded">&#x2191;</kbd> <kbd className="px-1 bg-surface-tertiary rounded">&#x2193;</kbd></span>
          <span>Open with <kbd className="px-1 bg-surface-tertiary rounded">&#x21B5;</kbd></span>
        </div>
      </div>
    </div>
  )
}
