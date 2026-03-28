'use client'

import { useEffect } from 'react'

type ShortcutOptions = {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  handler: (e: KeyboardEvent) => void
  enabled?: boolean
}

export function useKeyboardShortcut({ key, ctrlKey, metaKey, shiftKey, altKey, handler, enabled = true }: ShortcutOptions) {
  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(e: KeyboardEvent) {
      const isModifierMatch =
        (ctrlKey === undefined || e.ctrlKey === ctrlKey) &&
        (metaKey === undefined || e.metaKey === metaKey) &&
        (shiftKey === undefined || e.shiftKey === shiftKey) &&
        (altKey === undefined || e.altKey === altKey)

      if (e.key.toLowerCase() === key.toLowerCase() && isModifierMatch) {
        // Don't trigger shortcuts when typing in inputs
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

        e.preventDefault()
        handler(e)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [key, ctrlKey, metaKey, shiftKey, altKey, handler, enabled])
}
