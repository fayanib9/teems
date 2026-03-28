'use client'

import { useEffect, useCallback, useRef } from 'react'

/**
 * Hook to warn users about unsaved changes when navigating away.
 * @param hasChanges - whether the form has unsaved changes
 */
export function useUnsavedChanges(hasChanges: boolean) {
  const hasChangesRef = useRef(hasChanges)
  hasChangesRef.current = hasChanges

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (hasChangesRef.current) {
      e.preventDefault()
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
      return e.returnValue
    }
  }, [])

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [handleBeforeUnload])
}
