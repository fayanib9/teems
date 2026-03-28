'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CalendarDays, CheckSquare, Truck, Mic, Building2, X } from 'lucide-react'

type SearchResult = {
  type: 'event' | 'task' | 'vendor' | 'speaker' | 'client'
  id: number
  name: string
  href: string
  status: string | null
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  event: CalendarDays,
  task: CheckSquare,
  vendor: Truck,
  speaker: Mic,
  client: Building2,
}

const TYPE_LABELS: Record<string, string> = {
  event: 'Events',
  task: 'Tasks',
  vendor: 'Vendors',
  speaker: 'Speakers',
  client: 'Clients',
}

export function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push(r)
    return acc
  }, {})

  // Flat list for keyboard navigation
  const flatResults = Object.values(grouped).flat()

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) return
      const data = await res.json()
      setResults(data.results || [])
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { search(query) }, 300)
    return () => clearTimeout(timer)
  }, [query, search])

  // Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0 && flatResults[selectedIndex]) {
      e.preventDefault()
      navigateTo(flatResults[selectedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  function navigateTo(result: SearchResult) {
    router.push(result.href)
    setQuery('')
    setIsOpen(false)
    setResults([])
    setSelectedIndex(-1)
  }

  let flatIndex = -1

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 h-9 px-3 bg-surface-tertiary/50 rounded-lg border border-transparent focus-within:border-primary-300 focus-within:bg-surface transition-all">
        <Search className="h-4 w-4 text-text-tertiary shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); setSelectedIndex(-1) }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          className="bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none w-32 sm:w-48 lg:w-56"
        />
        {query ? (
          <button onClick={() => { setQuery(''); setResults([]); setIsOpen(false) }} className="text-text-tertiary hover:text-text-secondary">
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-text-tertiary bg-surface-tertiary px-1.5 py-0.5 rounded border border-border-light">
            <span className="text-[11px]">&#8984;</span>K
          </kbd>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full mt-1 left-0 right-0 w-80 bg-surface rounded-xl shadow-lg border border-border z-50 overflow-hidden">
          {loading && results.length === 0 && (
            <p className="text-sm text-text-tertiary text-center py-4">Searching...</p>
          )}

          {!loading && results.length === 0 && query.length >= 2 && (
            <p className="text-sm text-text-tertiary text-center py-4">No results found</p>
          )}

          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <div className="px-3 py-1.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider bg-surface-secondary">
                {TYPE_LABELS[type] || type}
              </div>
              {items.map(item => {
                flatIndex++
                const currentIndex = flatIndex
                const Icon = TYPE_ICONS[item.type] || Search
                const isSelected = currentIndex === selectedIndex

                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => navigateTo(item)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors ${
                      isSelected ? 'bg-primary-50' : 'hover:bg-surface-secondary'
                    }`}
                  >
                    <Icon className="h-4 w-4 text-text-tertiary shrink-0" />
                    <span className="text-sm text-text-primary truncate flex-1">{item.name}</span>
                    {item.status && (
                      <span className="text-[10px] text-text-tertiary capitalize">{item.status.replace(/_/g, ' ')}</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
